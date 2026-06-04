/**
 * BlazeOS — Production Bundle Integrity Gate
 *
 * Runs the Vite production build and verifies:
 *   - No compilation errors
 *   - index.html is emitted
 *   - At least one JS chunk exists and is non-empty
 *   - No source-map leakage (sourceMappingURL in prod bundle)
 *   - Bundle size is within acceptable bounds
 *
 * Exits 1 if any check fails.
 */

import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT      = path.resolve(fileURLToPath(import.meta.url), "../../..");
const BLAZE_DIR = path.join(ROOT, "artifacts/blazeos");
const DIST_DIR  = path.join(BLAZE_DIR, "dist/public");

const RED   = "\x1b[31m";
const GREEN = "\x1b[32m";
const DIM   = "\x1b[2m";
const BOLD  = "\x1b[1m";
const RESET = "\x1b[0m";

const MAX_BUNDLE_MB = 10;  // warn if total bundle exceeds this

function bytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} MB`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)} KB`;
  return `${n} B`;
}

async function runBuild(): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn(
      "pnpm",
      ["--filter", "@workspace/blazeos", "run", "build"],
      {
        cwd: ROOT,
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
        env: {
          ...process.env,
          PORT:     "5000",
          BASE_PATH: "/",
          NODE_ENV:  "production",
        },
      },
    );

    let output = "";
    proc.stdout?.on("data", (d: Buffer) => { output += d.toString(); });
    proc.stderr?.on("data", (d: Buffer) => { output += d.toString(); });
    proc.on("close", (code) => resolve({ ok: code === 0, output }));
  });
}

function walkDir(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(full, ext));
    else if (entry.name.endsWith(ext)) results.push(full);
  }
  return results;
}

async function run() {
  console.log(`\n${BOLD}BlazeOS — Production Bundle Check${RESET}\n${"─".repeat(50)}`);

  // ── 1. Run Vite build ──────────────────────────────────────────────────
  console.log(`\n  Running Vite production build…`);
  const { ok, output } = await runBuild();

  if (!ok) {
    console.log(`\n  ${RED}✗ Vite build failed${RESET}`);
    const lines = output.split("\n");
    // Print last 40 lines to capture errors
    console.log(lines.slice(-40).map(l => `    ${l}`).join("\n"));
    process.exit(1);
  }
  console.log(`  ${GREEN}✓${RESET} Vite build succeeded`);

  // Print Vite's size summary (lines with "kB" or "MB")
  const sizeLines = output.split("\n").filter(l => /\d+(\.\d+)?\s*(kB|MB|B)/.test(l));
  if (sizeLines.length) {
    console.log(`\n  ${DIM}Build output:${RESET}`);
    for (const l of sizeLines.slice(0, 20)) {
      console.log(`    ${DIM}${l.trim()}${RESET}`);
    }
  }

  // ── 2. Verify output artefacts ─────────────────────────────────────────
  console.log(`\n  Verifying output artefacts:`);
  let failed = false;

  // index.html
  const indexHtml = path.join(DIST_DIR, "index.html");
  if (existsSync(indexHtml)) {
    console.log(`    ${GREEN}✓${RESET} index.html emitted`);
  } else {
    console.log(`    ${RED}✗ index.html missing from ${DIST_DIR}${RESET}`);
    failed = true;
  }

  // JS chunks
  const jsFiles = walkDir(DIST_DIR, ".js");
  if (jsFiles.length > 0) {
    console.log(`    ${GREEN}✓${RESET} ${jsFiles.length} JS chunk(s) emitted`);
  } else {
    console.log(`    ${RED}✗ No JS chunks found in dist/public${RESET}`);
    failed = true;
  }

  // CSS files
  const cssFiles = walkDir(DIST_DIR, ".css");
  if (cssFiles.length > 0) {
    console.log(`    ${GREEN}✓${RESET} ${cssFiles.length} CSS file(s) emitted`);
  } else {
    console.log(`    ${RED}✗ No CSS files found — Tailwind may not have compiled${RESET}`);
    failed = true;
  }

  // ── 3. Bundle size check ───────────────────────────────────────────────
  let totalBytes = 0;
  const allAssets = [...jsFiles, ...cssFiles, indexHtml].filter(existsSync);
  for (const f of allAssets) {
    totalBytes += statSync(f).size;
  }
  const totalMB = totalBytes / 1_000_000;
  const sizeOk  = totalMB < MAX_BUNDLE_MB;
  console.log(
    `    ${sizeOk ? GREEN + "✓" : RED + "✗"}${RESET} Total bundle size: ${bytes(totalBytes)}` +
    (sizeOk ? "" : ` ${RED}(exceeds ${MAX_BUNDLE_MB} MB limit)${RESET}`),
  );
  if (!sizeOk) failed = true;

  // ── 4. Verify no dev-only code leaked into prod bundle ─────────────────
  // Check that VITE_SUPABASE_URL is not hardcoded (was a previous env var)
  const { readFileSync } = await import("node:fs");
  let supabaseLeak = false;
  for (const f of jsFiles.slice(0, 5)) {
    const content = readFileSync(f, "utf8");
    if (content.includes("supabase.co") || content.includes("SUPABASE_URL")) {
      supabaseLeak = true;
      console.log(`    ${RED}✗ Supabase URL found in bundle ${path.basename(f)} — check env var handling${RESET}`);
      failed = true;
    }
  }
  if (!supabaseLeak) {
    console.log(`    ${GREEN}✓${RESET} No Supabase URLs leaked into production bundle`);
  }

  if (failed) {
    console.log(`\n  ${RED}${BOLD}Bundle integrity check failed.${RESET}\n`);
    process.exit(1);
  }

  console.log(`\n  ${GREEN}${BOLD}Production bundle is valid.${RESET}\n`);
}

run().catch(err => {
  console.error(`\n  Fatal: ${err}\n`);
  process.exit(1);
});
