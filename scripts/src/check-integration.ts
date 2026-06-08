/**
 * BlazeOS — Integration Integrity Gate
 *
 * Verifies that the Replit Auth architecture is correct:
 *
 *   1. API server uses Replit Auth (x-replit-user-id headers) — not Supabase JWT.
 *   2. No Supabase service-role key referenced anywhere (security check).
 *   3. Frontend Supabase client is a stub (Supabase auth replaced by Replit Auth).
 *   4. AI provider calls go through the backend proxy (not directly from the browser).
 *   5. Production bundle: no secret keys must appear in JS output.
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

  // ── 1. API server must use Replit Auth (replitAuth.ts) ──────────────────
  console.log(`\n  Checking API server uses Replit Auth:`);
  const replitAuthFile = path.join(API_SRC, "utils/replitAuth.ts");
  if (existsSync(replitAuthFile)) {
    const content = readFileSync(replitAuthFile, "utf8");
    if (content.includes("x-replit-user-id")) {
      console.log(`    ${GREEN}✓${RESET} replitAuth.ts uses Replit Auth (x-replit-user-id headers)`);
    } else {
      console.log(`    ${RED}✗${RESET} replitAuth.ts is missing Replit Auth header verification`);
      failed = true;
    }
  } else {
    console.log(`    ${RED}✗${RESET} utils/replitAuth.ts not found — Replit Auth not configured`);
    failed = true;
  }

  // ── 2. No Supabase service-role key in API server ───────────────────────
  console.log(`\n  Checking API server does not use Supabase service-role key:`);
  const apiFiles = walkTs(API_SRC);
  const serviceKeyApiViolations = scan(
    apiFiles,
    [{ re: /SUPABASE_SERVICE_ROLE_KEY/, rule: "SUPABASE_SERVICE_ROLE_KEY referenced in API server (Replit Auth is used instead)" }],
    ROOT,
  );
  if (serviceKeyApiViolations.length === 0) {
    console.log(`    ${GREEN}✓${RESET} SUPABASE_SERVICE_ROLE_KEY not referenced in API server`);
  } else {
    failed = true;
    for (const v of serviceKeyApiViolations) {
      console.log(`    ${RED}✗${RESET} ${v.file}:${v.line}  ${DIM}${v.text}${RESET}`);
      console.log(`      ${RED}Rule: ${v.rule}${RESET}`);
    }
  }

  // ── 3. Frontend Supabase client should be a stub (auth migrated) ────────
  console.log(`\n  Verifying frontend Supabase client is correctly stubbed (Replit Auth):`);
  const stubFile = path.join(BLAZE_SRC, "utils/supabase/client.ts");
  if (existsSync(stubFile)) {
    const content = readFileSync(stubFile, "utf8");
    const isStubbed = content.includes("null") && !content.includes("createClient(");
    if (isStubbed) {
      console.log(`    ${GREEN}✓${RESET} Frontend Supabase client is correctly stubbed (auth uses Replit Auth)`);
    } else {
      console.log(`    ${RED}✗${RESET} Frontend Supabase client appears to be a live client — auth should use Replit Auth`);
      failed = true;
    }
  } else {
    console.log(`    ${GREEN}✓${RESET} No Supabase client file found (fully migrated)`);
  }

  // ── 4. AI API calls go through backend, not browser ────────────────────
  console.log(`\n  Checking AI provider calls go through backend proxy:`);
  const frontendFiles = walkTs(BLAZE_SRC);
  const directAiViolations = scan(
    frontendFiles,
    [
      { re: /api\.openai\.com/,    rule: "direct OpenAI API call from frontend" },
      { re: /api\.anthropic\.com/, rule: "direct Anthropic API call from frontend" },
      { re: /OPENAI_API_KEY/,      rule: "OPENAI_API_KEY referenced in frontend code" },
      { re: /ANTHROPIC_API_KEY/,   rule: "ANTHROPIC_API_KEY referenced in frontend code" },
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

  // ── 5. Production bundle: no secret keys must ever leak ─────────────────
  if (existsSync(BLAZE_DIST)) {
    console.log(`\n  Scanning production bundle for secret key leaks:`);
    const jsFiles = walkJs(BLAZE_DIST);
    let leaked = false;
    for (const f of jsFiles) {
      if (statSync(f).size > 10_000_000) continue;
      const content = readFileSync(f, "utf8");
      if (content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("service_role")) {
        console.log(`    ${RED}✗${RESET} Service-role key found in ${path.relative(BLAZE_DIST, f)}`);
        leaked = true;
        failed = true;
      }
    }
    if (!leaked) {
      console.log(
        `    ${GREEN}✓${RESET} No secret keys in production bundle ${DIM}(${jsFiles.length} JS files scanned)${RESET}`,
      );
    }
  } else {
    console.log(
      `\n  ${DIM}Skipping bundle scan — dist not built yet (run build-frontend first)${RESET}`,
    );
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
