/**
 * BlazeOS — Database Connectivity Gate
 *
 * Validates that the Postgres database is reachable, the schema
 * is fully applied (all expected tables exist), and basic queries
 * succeed.  Exits 1 with a human-readable report if anything fails.
 */

import pg from "pg";

const { Client } = pg;

const RED   = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM   = "\x1b[2m";
const BOLD  = "\x1b[1m";
const RESET = "\x1b[0m";

const REQUIRED_TABLES = [
  "sessions",
  "users",
  "trades",
  "clients",
  "notes",
  "calendar_events",
  "finances",
  "daily_bias",
  "user_settings",
  "trade_screenshots",
];

async function run() {
  console.log(`\n${BOLD}BlazeOS — Database Connectivity Check${RESET}\n${"─".repeat(50)}`);

  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.log(`\n  ${RED}✗ DATABASE_URL is not set${RESET}`);
    process.exit(1);
  }

  // ── 1. Connect ─────────────────────────────────────────────────────────
  const client = new Client({ connectionString: url });
  const t0 = Date.now();

  try {
    await client.connect();
  } catch (err) {
    console.log(`\n  ${RED}✗ Cannot connect to database${RESET}`);
    console.log(`    ${DIM}${String(err)}${RESET}`);
    process.exit(1);
  }

  const connectMs = Date.now() - t0;
  console.log(`\n  ${GREEN}✓${RESET} Connected to Postgres ${DIM}(${connectMs}ms)${RESET}`);

  let failed = false;

  try {
    // ── 2. Ping ────────────────────────────────────────────────────────────
    const pingT = Date.now();
    await client.query("SELECT 1");
    console.log(`  ${GREEN}✓${RESET} Ping ok ${DIM}(${Date.now() - pingT}ms)${RESET}`);

    // ── 3. Check tables exist ──────────────────────────────────────────────
    console.log(`\n  Checking schema tables:`);

    const { rows } = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'`,
    );
    const existing = new Set(rows.map((r) => r.table_name));

    const missing: string[] = [];
    for (const table of REQUIRED_TABLES) {
      if (existing.has(table)) {
        console.log(`    ${GREEN}✓${RESET} ${table}`);
      } else {
        console.log(`    ${RED}✗${RESET} ${table} ${RED}(missing)${RESET}`);
        missing.push(table);
        failed = true;
      }
    }

    if (missing.length > 0) {
      console.log(`\n  ${RED}${BOLD}Missing tables: ${missing.join(", ")}${RESET}`);
      console.log(`  ${YELLOW}Run: pnpm --filter @workspace/db run push${RESET}\n`);
    }

    // ── 4. Row-count spot check ────────────────────────────────────────────
    if (!failed) {
      console.log(`\n  Row-count spot checks:`);
      const tables = ["users", "sessions", "user_settings"];
      for (const t of tables) {
        const { rows: countRows } = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM "${t}"`,
        );
        const count = countRows[0]?.count ?? "?";
        console.log(`    ${GREEN}✓${RESET} ${t.padEnd(20)} ${DIM}${count} row(s)${RESET}`);
      }
    }

    // ── 5. Session table has correct column types ──────────────────────────
    const { rows: cols } = await client.query<{
      column_name: string;
      data_type: string;
    }>(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'sessions' AND table_schema = 'public'`,
    );
    const colMap = Object.fromEntries(cols.map((c) => [c.column_name, c.data_type]));
    const hasSid  = "sid"    in colMap;
    const hasSess = "sess"   in colMap;
    const hasExp  = "expire" in colMap;

    if (hasSid && hasSess && hasExp) {
      console.log(`\n  ${GREEN}✓${RESET} sessions table schema is correct`);
    } else {
      console.log(`\n  ${RED}✗ sessions table schema is incorrect:${RESET}`);
      console.log(`    ${DIM}Found columns: ${Object.keys(colMap).join(", ")}${RESET}`);
      failed = true;
    }

  } finally {
    await client.end().catch(() => {});
  }

  if (failed) {
    console.log(`\n  ${RED}${BOLD}Database check failed.${RESET}\n`);
    process.exit(1);
  }

  console.log(`\n  ${GREEN}${BOLD}Database is healthy.${RESET}\n`);
}

run().catch((err) => {
  console.error(`\n  Fatal: ${err}\n`);
  process.exit(1);
});
