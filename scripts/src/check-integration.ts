/**
 * BlazeOS — Integration Integrity Gate
 *
 * Verifies that the Supabase Auth + Storage architecture is correct:
 *
 *   1. API server uses @supabase/supabase-js for JWT verification (required).
 *   2. SUPABASE_ANON_KEY is never referenced in API server code (frontend-only).
 *   3. Frontend Supabase client is a real client, not a stub.
 *   4. SUPABASE_SERVICE_ROLE_KEY is never referenced in frontend source.
 *   5. AI provider calls go through the backend proxy (not directly from the browser).
 *   6. Production bundle: SUPABASE_SERVICE_ROLE_KEY must never appear in JS output.
 *
 * Note: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are intentionally bundled
 * into the frontend — the anon key is public by design and protected by Supabase RLS.
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

  // ── 1. API server must import @supabase/supabase-js (JWT verification) ──
  console.log(`\n  Checking API server uses Supabase for JWT verification:`);
  const apiFiles = walkTs(API_SRC);
  const apiAuthFile = path.join(API_SRC, "utils/supabaseAuth.ts");
  if (existsSync(apiAuthFile)) {
    const content = readFileSync(apiAuthFile, "utf8");
    if (content.includes("@supabase/supabase-js") && content.includes("getUser")) {
      console.log(`    ${GREEN}✓${RESET} supabaseAuth.ts uses Supabase JWT verification`);
    } else {
      console.log(`    ${RED}✗${RESET} supabaseAuth.ts is missing Supabase JWT verification`);
      failed = true;
    }
  } else {
    console.log(`    ${RED}✗${RESET} utils/supabaseAuth.ts not found — Supabase Auth not configured`);
    failed = true;
  }

  // ── 2. API server must NOT reference SUPABASE_ANON_KEY ─────────────────
  console.log(`\n  Checking API server does not use the anon key (frontend-only):`);
  const anonKeyViolations = scan(
    apiFiles,
    [{ re: /SUPABASE_ANON_KEY/, rule: "SUPABASE_ANON_KEY referenced in API server (use SERVICE_ROLE_KEY instead)" }],
    ROOT,
  );
  if (anonKeyViolations.length === 0) {
    console.log(`    ${GREEN}✓${RESET} SUPABASE_ANON_KEY not referenced in API server`);
  } else {
    failed = true;
    for (const v of anonKeyViolations) {
      console.log(`    ${RED}✗${RESET} ${v.file}:${v.line}  ${DIM}${v.text}${RESET}`);
      console.log(`      ${RED}Rule: ${v.rule}${RESET}`);
    }
  }

  // ── 3. Frontend Supabase client must be a real client, not a stub ───────
  console.log(`\n  Verifying frontend Supabase client is real (not a stub):`);
  const stubFile = path.join(BLAZE_SRC, "utils/supabase/client.ts");
  if (existsSync(stubFile)) {
    const content = readFileSync(stubFile, "utf8");
    const isReal  = content.includes("createClient") && content.includes("VITE_SUPABASE");
    const isStub  = content.includes("session: null") || content.includes("stub");
    if (isReal && !isStub) {
      console.log(`    ${GREEN}✓${RESET} Frontend Supabase client is a live client`);
    } else {
      console.log(`    ${RED}✗${RESET} ${path.relative(ROOT, stubFile)} appears to be a stub — restore the real Supabase client`);
      failed = true;
    }
  } else {
    console.log(`    ${RED}✗${RESET} utils/supabase/client.ts not found`);
    failed = true;
  }

  // ── 4. Frontend must NOT reference SUPABASE_SERVICE_ROLE_KEY ───────────
  console.log(`\n  Checking frontend does not expose the service-role key:`);
  const frontendFiles = walkTs(BLAZE_SRC);
  const serviceKeyViolations = scan(
    frontendFiles,
    [{ re: /SUPABASE_SERVICE_ROLE_KEY/, rule: "SUPABASE_SERVICE_ROLE_KEY in frontend source — this key must never reach the browser" }],
    ROOT,
  );
  if (serviceKeyViolations.length === 0) {
    console.log(`    ${GREEN}✓${RESET} SUPABASE_SERVICE_ROLE_KEY not referenced in frontend`);
  } else {
    failed = true;
    for (const v of serviceKeyViolations) {
      console.log(`    ${RED}✗${RESET} ${v.file}:${v.line}  ${DIM}${v.text}${RESET}`);
      console.log(`      ${RED}Rule: ${v.rule}${RESET}`);
    }
  }

  // ── 5. AI API calls go through backend, not browser ────────────────────
  console.log(`\n  Checking AI provider calls go through backend proxy:`);
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

  // ── 6. Production bundle: service-role key must never leak ─────────────
  if (existsSync(BLAZE_DIST)) {
    console.log(`\n  Scanning production bundle for service-role key leaks:`);
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
        `    ${GREEN}✓${RESET} No service-role key in production bundle ${DIM}(${jsFiles.length} JS files scanned)${RESET}`,
      );
      console.log(
        `    ${DIM}Note: Supabase URL and anon key are intentionally bundled (public by design)${RESET}`,
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
