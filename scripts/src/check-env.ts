/**
 * BlazeOS — Environment Variable Gate
 *
 * Validates that every env var required to start the API server and run
 * auth/database operations is present.  Exits 1 with a human-readable
 * error report if anything is missing.
 */

interface EnvRule {
  key: string;
  description: string;
  /** When true the check is advisory only (warns but doesn't fail). */
  advisory?: boolean;
}

const REQUIRED: EnvRule[] = [
  { key: "DATABASE_URL",   description: "PostgreSQL connection string (Replit DB)" },
  { key: "SESSION_SECRET", description: "Express-session signing secret (Replit Auth)" },
  { key: "REPL_ID",        description: "Replit Repl identifier (OIDC client_id)" },
];

const ADVISORY: EnvRule[] = [
  { key: "REPLIT_DOMAINS", description: "Replit proxy domains (auto-injected in Replit environment)", advisory: true },
];

const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN  = "\x1b[32m";
const DIM    = "\x1b[2m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

function check(rules: EnvRule[]): { missing: EnvRule[]; present: EnvRule[] } {
  const missing: EnvRule[] = [];
  const present: EnvRule[] = [];
  for (const rule of rules) {
    const val = process.env[rule.key];
    if (!val || val.trim() === "") {
      missing.push(rule);
    } else {
      present.push(rule);
    }
  }
  return { missing, present };
}

function run() {
  console.log(`\n${BOLD}BlazeOS — Environment Check${RESET}\n${"─".repeat(50)}`);

  const { missing: requiredMissing, present: requiredPresent } = check(REQUIRED);
  const { missing: advisoryMissing } = check(ADVISORY);

  for (const r of requiredPresent) {
    console.log(`  ${GREEN}✓${RESET} ${r.key.padEnd(22)} ${DIM}${r.description}${RESET}`);
  }

  for (const r of advisoryMissing) {
    console.log(`  ${YELLOW}⚠${RESET} ${r.key.padEnd(22)} ${DIM}missing (advisory) — ${r.description}${RESET}`);
  }

  if (requiredMissing.length > 0) {
    console.log(`\n  ${RED}✗ Missing required environment variables:${RESET}`);
    for (const r of requiredMissing) {
      console.log(`    ${RED}•${RESET} ${BOLD}${r.key}${RESET} — ${r.description}`);
    }
    console.log(`\n  Set these in Replit's Secrets panel before deploying.\n`);
    process.exit(1);
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env["DATABASE_URL"]!;
  if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
    console.log(`\n  ${RED}✗ DATABASE_URL must start with postgres:// or postgresql://${RESET}`);
    console.log(`    Got: ${dbUrl.slice(0, 30)}…\n`);
    process.exit(1);
  }
  console.log(`  ${GREEN}✓${RESET} DATABASE_URL format          ${DIM}valid postgres:// URI${RESET}`);

  // SESSION_SECRET length check (should be at least 32 chars for security)
  const secret = process.env["SESSION_SECRET"]!;
  if (secret.length < 32) {
    console.log(`\n  ${RED}✗ SESSION_SECRET is too short (${secret.length} chars, minimum 32)${RESET}`);
    console.log(`    Regenerate with: openssl rand -base64 48\n`);
    process.exit(1);
  }
  console.log(`  ${GREEN}✓${RESET} SESSION_SECRET length        ${DIM}${secret.length} chars (≥32 required)${RESET}`);

  console.log(`\n  ${GREEN}${BOLD}All required environment variables are present.${RESET}\n`);
}

run();
