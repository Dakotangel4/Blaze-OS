/**
 * BlazeOS — Environment Variable Gate
 *
 * Validates that every env var required to start the API server and run
 * Replit Auth + database operations is present. Exits 1 with a human-
 * readable error report if anything is missing.
 *
 * Auth provider: Replit Auth (x-replit-user-id headers via Replit proxy)
 * Database:      PostgreSQL (connection string via DATABASE_URL)
 */

interface EnvRule {
  key: string;
  description: string;
  advisory?: boolean;
}

const REQUIRED: EnvRule[] = [
  {
    key: "DATABASE_URL",
    description: "PostgreSQL connection string",
  },
];

const ADVISORY: EnvRule[] = [
  {
    key: "REPL_ID",
    description: "Replit runtime ID (auto-set by Replit — not required locally)",
    advisory: true,
  },
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
    console.log(`  ${GREEN}✓${RESET} ${r.key.padEnd(28)} ${DIM}${r.description}${RESET}`);
  }

  for (const r of advisoryMissing) {
    console.log(`  ${YELLOW}⚠${RESET}  ${r.key.padEnd(27)} ${DIM}missing (advisory) — ${r.description}${RESET}`);
  }

  if (requiredMissing.length > 0) {
    console.log(`\n  ${RED}✗ Missing required environment variables:${RESET}`);
    for (const r of requiredMissing) {
      console.log(`    ${RED}•${RESET} ${BOLD}${r.key}${RESET} — ${r.description}`);
    }
    console.log(
      `\n  Set these in your Replit Secrets panel before deploying.\n`,
    );
    process.exit(1);
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env["DATABASE_URL"]!;
  if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
    console.log(`\n  ${RED}✗ DATABASE_URL must start with postgres:// or postgresql://${RESET}`);
    console.log(`    Got: ${dbUrl.slice(0, 30)}…\n`);
    process.exit(1);
  }
  console.log(`  ${GREEN}✓${RESET} DATABASE_URL format              ${DIM}valid postgres:// URI${RESET}`);

  console.log(`\n  ${GREEN}${BOLD}All required environment variables are present.${RESET}\n`);
}

run();
