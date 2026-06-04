/**
 * BlazeOS — Integration Integrity Gate
 *
 * Verifies that:
 *   1. Supabase is fully stubbed — no live Supabase client is imported
 *      anywhere in the API server (only the frontend stub is allowed).
 *   2. No live Supabase URL / anon key is referenced from server-side code.
 *   3. AI provider calls go through the backend proxy (not directly from
 *      the frontend bundle via exposed VITE_* keys).
 *   4. No VITE_* prefixed secrets exist in the environment (they would be
 *      shipped to the browser at build time).
 *
 * Exits 1 with a human-readable report if any check fails.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT       = path.resolve(fileURLToPath(import.meta.url), "../../..");
const API_SRC    = path.join(ROOT, "artifacts/api-server/src");
const BLAZE_SRC  = path.join(ROOT, "artifacts/blazeos/src");
const BLAZE_DIST = path.join(ROOT, "artifacts/blazeos/dist/public");

const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM    = "\x1b[2m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

function walkTs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkTs(full));
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(full);
  }
  return out;
}

function walkJs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkJs(full));
    else if (ent.name.endsWith(".js")) out.push(full);
  }
  return out;
}

interface Violation {
  file: string;
  line: number;
  text: string;
  rule: string;
}

function scan(
  files: string[],
  patterns: Array<{ re: RegExp; rule: string }>,
  relBase: string,
): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const lines   = content.split("\n");
    for (const { re, rule } of patterns) {
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i]!)) {
          violations.push({
            file: path.relative(relBase, file),
            line: i + 1,
            text: lines[i]!.trim().slice(0, 120),
            rule,
          });
        }
      }
    }
  }
  return violations;
}

async function run() {
  console.log(`\n${BOLD}BlazeOS — Integration Integrity Check${RESET}\n${"─".repeat(50)}`);
  let failed = false;

  // ── 1. API server must NOT import @supabase/supabase-js ───────────────
  console.log(`\n  Checking API server for live Supabase imports:`);
  const apiFiles = walkTs(API_SRC);

  const supabaseImportRe = /from\s+['"]@supabase\/supabase-js['"]/;
  const supabaseCreateRe = /createClient\s*\(/;

  const apiSupabaseViolations: Violation[] = [];
  for (const file of apiFiles) {
    const content = readFileSync(file, "utf8");
    const lines   = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (supabaseImportRe.test(line)) {
        apiSupabaseViolations.push({
          file: path.relative(ROOT, file),
          line: i + 1,
          text: line.trim().slice(0, 120),
          rule: "live @supabase/supabase-js import in API server",
        });
      }
    }
  }

  if (apiSupabaseViolations.length === 0) {
    console.log(`    ${GREEN}✓${RESET} No live Supabase imports in API server`);
  } else {
    failed = true;
    for (const v of apiSupabaseViolations) {
      console.log(`    ${RED}✗${RESET} ${v.file}:${v.line}  ${DIM}${v.text}${RESET}`);
      console.log(`      ${RED}Rule: ${v.rule}${RESET}`);
    }
  }

  // ── 2. No raw Supabase URL hardcoded in server code ────────────────────
  console.log(`\n  Checking API server for hardcoded Supabase credentials:`);
  const credViolations = scan(
    apiFiles,
    [
      { re: /supabase\.co/,           rule: "hardcoded supabase.co domain in API server" },
      { re: /SUPABASE_ANON_KEY/,      rule: "SUPABASE_ANON_KEY referenced in API server" },
      { re: /SUPABASE_SERVICE_KEY/,   rule: "SUPABASE_SERVICE_KEY referenced in API server" },
    ],
    ROOT,
  );

  if (credViolations.length === 0) {
    console.log(`    ${GREEN}✓${RESET} No hardcoded Supabase credentials in API server`);
  } else {
    failed = true;
    for (const v of credViolations) {
      console.log(`    ${RED}✗${RESET} ${v.file}:${v.line}  ${DIM}${v.text}${RESET}`);
      console.log(`      ${RED}Rule: ${v.rule}${RESET}`);
    }
  }

  // ── 3. Frontend stub uses session cookies, not a live client ──────────
  console.log(`\n  Verifying frontend Supabase stub is a stub (not live client):`);
  const stubFile = path.join(BLAZE_SRC, "utils/supabase/client.ts");
  if (existsSync(stubFile)) {
    const content = readFileSync(stubFile, "utf8");
    const isLive  = content.includes("createClient") && content.includes("supabase.co");
    const isStub  = content.includes("session: null") || content.includes("stub");
    if (isLive && !isStub) {
      console.log(`    ${RED}✗${RESET} ${path.relative(ROOT, stubFile)} appears to be a live Supabase client`);
      failed = true;
    } else {
      console.log(`    ${GREEN}✓${RESET} Frontend Supabase client is a stub`);
    }
  } else {
    console.log(`    ${GREEN}✓${RESET} No Supabase client file in frontend (already removed)`);
  }

  // ── 4. No VITE_* secrets in environment ────────────────────────────────
  console.log(`\n  Checking for VITE_* secrets that would leak to browser:`);
  const viteSecrets = Object.keys(process.env).filter(
    (k) => k.startsWith("VITE_") && process.env[k],
  );
  if (viteSecrets.length === 0) {
    console.log(`    ${GREEN}✓${RESET} No VITE_* environment variables set`);
  } else {
    for (const key of viteSecrets) {
      console.log(`    ${YELLOW}⚠${RESET}  ${key} is set — it will be embedded in the production bundle`);
      if (key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("token")) {
        console.log(`      ${RED}✗ This looks like a secret — must not use VITE_* prefix${RESET}`);
        failed = true;
      }
    }
  }

  // ── 5. AI API calls go through backend, not browser ────────────────────
  console.log(`\n  Checking AI provider calls go through backend proxy:`);
  const frontendFiles = walkTs(BLAZE_SRC);
  const directAiViolations = scan(
    frontendFiles,
    [
      { re: /api\.openai\.com/,       rule: "direct OpenAI API call from frontend" },
      { re: /api\.anthropic\.com/,    rule: "direct Anthropic API call from frontend" },
      { re: /OPENAI_API_KEY/,         rule: "OPENAI_API_KEY referenced in frontend code" },
      { re: /ANTHROPIC_API_KEY/,      rule: "ANTHROPIC_API_KEY referenced in frontend code" },
    ],
    ROOT,
  );

  if (directAiViolations.length === 0) {
    console.log(`    ${GREEN}✓${RESET} No direct AI provider calls from frontend`);
  } else {
    failed = true;
    for (const v of directAiViolations) {
      console.log(`    ${RED}✗${RESET} ${v.file}:${v.line}  ${DIM}${v.text}${RESET}`);
      console.log(`      ${RED}Rule: ${v.rule}${RESET}`);
    }
  }

  // ── 6. Production bundle: no Supabase URL leaked (if built) ───────────
  if (existsSync(BLAZE_DIST)) {
    console.log(`\n  Scanning production bundle for credential leaks:`);
    const jsFiles = walkJs(BLAZE_DIST);
    let leaked = false;
    for (const f of jsFiles) {
      const size = statSync(f).size;
      if (size > 10_000_000) continue; // skip huge files for perf
      const content = readFileSync(f, "utf8");
      if (content.includes("supabase.co") || content.includes("SUPABASE_URL")) {
        console.log(`    ${RED}✗${RESET} Supabase URL found in ${path.relative(BLAZE_DIST, f)}`);
        leaked = true;
        failed = true;
      }
      if (content.includes("eyJhbGci")) {
        // JWT prefix — likely an anon key leaked
        console.log(`    ${RED}✗${RESET} Possible JWT/anon key found in ${path.relative(BLAZE_DIST, f)}`);
        leaked = true;
        failed = true;
      }
    }
    if (!leaked) {
      console.log(`    ${GREEN}✓${RESET} No credentials leaked in production bundle (${jsFiles.length} JS files scanned)`);
    }
  } else {
    console.log(`\n  ${DIM}Skipping bundle scan — dist not built yet (run check-bundle first)${RESET}`);
  }

  // ── Result ─────────────────────────────────────────────────────────────
  if (failed) {
    console.log(`\n  ${RED}${BOLD}Integration integrity check failed.${RESET}\n`);
    process.exit(1);
  }
  console.log(`\n  ${GREEN}${BOLD}All integration checks passed.${RESET}\n`);
}

run().catch((err) => {
  console.error(`\n  Fatal: ${err}\n`);
  process.exit(1);
});
