/**
 * BlazeOS — CI/CD Validation Orchestrator
 *
 * Runs every validation gate in dependency order and produces a
 * unified pass/fail report.  Exits 1 if any gate fails so that
 * deployments are blocked automatically.
 *
 * Pipeline stages (each stage waits for the previous to pass):
 *
 *   Stage 1 — Fast gates (parallel)
 *     • env-check        : required env vars present & formatted
 *     • integration      : no Supabase leaks, no direct AI calls
 *
 *   Stage 2 — DB & TypeScript (parallel, needs env)
 *     • db-check         : Postgres reachable, all tables present
 *     • typecheck        : zero TS errors across all packages
 *
 *   Stage 3 — API Build & Routes (sequential)
 *     • api-build        : esbuild compiles without errors
 *     • route-health     : server starts, all routes respond correctly
 *
 *   Stage 4 — Frontend Bundle (after api passes)
 *     • bundle-integrity : Vite prod build succeeds, artefacts valid
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../..");

// ── ANSI colours ────────────────────────────────────────────────────────
const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE   = "\x1b[34m";
const DIM    = "\x1b[2m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

// ── Types ────────────────────────────────────────────────────────────────
interface GateResult {
  name:    string;
  label:   string;
  passed:  boolean;
  skipped: boolean;
  ms:      number;
  output:  string;
}

// ── Run a single gate as a subprocess ────────────────────────────────────
function runGate(name: string, label: string, cmd: string, args: string[]): Promise<GateResult> {
  return new Promise((resolve) => {
    const t0  = Date.now();
    let output = "";

    const proc = spawn(cmd, args, {
      cwd:   ROOT,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      env:   { ...process.env },
    });

    proc.stdout?.on("data", (d: Buffer) => { output += d.toString(); });
    proc.stderr?.on("data", (d: Buffer) => { output += d.toString(); });

    proc.on("close", (code) => {
      resolve({
        name,
        label,
        passed:  code === 0,
        skipped: false,
        ms:      Date.now() - t0,
        output,
      });
    });

    proc.on("error", (err) => {
      resolve({
        name,
        label,
        passed:  false,
        skipped: false,
        ms:      Date.now() - t0,
        output:  String(err),
      });
    });
  });
}

function skipped(name: string, label: string, reason: string): GateResult {
  return { name, label, passed: false, skipped: true, ms: 0, output: reason };
}

// ── Print a live status line ──────────────────────────────────────────────
function printResult(r: GateResult) {
  const icon   = r.skipped ? `${YELLOW}○${RESET}` : r.passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
  const status = r.skipped ? `${YELLOW}SKIP${RESET}` : r.passed ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  const ms     = r.skipped ? "     " : `${String(r.ms).padStart(5)}ms`;
  console.log(`  ${icon}  ${status}  ${ms}  ${r.label}`);
}

// ── Summarise the last N lines of gate output ─────────────────────────────
function tailOutput(output: string, lines = 25): string {
  const trimmed = output.trim();
  if (!trimmed) return "";
  const all = trimmed.split("\n");
  return all.slice(-lines).map(l => `       ${DIM}│${RESET} ${l}`).join("\n");
}

// ── Stage header ─────────────────────────────────────────────────────────
function stageHeader(n: number, title: string) {
  console.log(`\n  ${BLUE}${BOLD}Stage ${n} — ${title}${RESET}`);
  console.log(`  ${"─".repeat(56)}`);
}

// ── Main orchestrator ────────────────────────────────────────────────────
async function run() {
  const start = Date.now();

  console.log(`\n${BOLD}╔════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║          BlazeOS CI/CD Validation Pipeline             ║${RESET}`);
  console.log(`${BOLD}╚════════════════════════════════════════════════════════╝${RESET}`);
  console.log(`  ${DIM}${new Date().toISOString()}${RESET}`);

  const results: GateResult[] = [];
  let pipelineFailed = false;

  // ════════════════════════════════════════════════════════
  // STAGE 1 — Fast gates (parallel)
  // ════════════════════════════════════════════════════════
  stageHeader(1, "Fast gates (parallel)");

  const [envResult, integrationResult] = await Promise.all([
    runGate("env",         "Environment variables",      "pnpm", ["--filter", "@workspace/scripts", "run", "check:env"]),
    runGate("integration", "Integration integrity",      "pnpm", ["--filter", "@workspace/scripts", "run", "check:integration"]),
  ]);

  for (const r of [envResult, integrationResult]) {
    printResult(r);
    results.push(r);
  }

  const stage1Failed = results.some(r => !r.passed && !r.skipped);

  // ════════════════════════════════════════════════════════
  // STAGE 2 — DB & TypeScript (parallel, needs env to pass)
  // ════════════════════════════════════════════════════════
  stageHeader(2, "Database & TypeScript (parallel)");

  let dbResult: GateResult;
  let tcResult: GateResult;

  if (stage1Failed) {
    dbResult = skipped("db",         "Database connectivity",     "Stage 1 failed — skipping DB check");
    tcResult = skipped("typecheck",  "TypeScript (all packages)", "Stage 1 failed — skipping typecheck");
    pipelineFailed = true;
  } else {
    [dbResult, tcResult] = await Promise.all([
      runGate("db",        "Database connectivity",     "pnpm", ["--filter", "@workspace/scripts", "run", "check:db"]),
      runGate("typecheck", "TypeScript (all packages)", "pnpm", ["run", "typecheck"]),
    ]);
  }

  for (const r of [dbResult, tcResult]) {
    printResult(r);
    results.push(r);
  }

  const stage2Failed = results.some(r => !r.passed && !r.skipped);

  // ════════════════════════════════════════════════════════
  // STAGE 3 — API build + route health (sequential)
  // ════════════════════════════════════════════════════════
  stageHeader(3, "API build & route health");

  let apiBuildResult: GateResult;
  let routeResult:    GateResult;

  if (stage2Failed) {
    apiBuildResult = skipped("api-build",    "API server build",    "Stage 2 failed — skipping");
    routeResult    = skipped("route-health", "Route health probes", "Stage 2 failed — skipping");
    pipelineFailed = true;
    printResult(apiBuildResult);
    printResult(routeResult);
    results.push(apiBuildResult, routeResult);
  } else {
    apiBuildResult = await runGate("api-build", "API server build", "pnpm", ["--filter", "@workspace/api-server", "run", "build"]);
    printResult(apiBuildResult);
    results.push(apiBuildResult);

    if (!apiBuildResult.passed) {
      routeResult = skipped("route-health", "Route health probes", "API build failed — skipping route probes");
      pipelineFailed = true;
    } else {
      routeResult = await runGate("route-health", "Route health probes", "pnpm", ["--filter", "@workspace/scripts", "run", "check:routes"]);
    }
    printResult(routeResult);
    results.push(routeResult);
  }

  const stage3Failed = results.some(r => !r.passed && !r.skipped);

  // ════════════════════════════════════════════════════════
  // STAGE 4 — Frontend production bundle
  // ════════════════════════════════════════════════════════
  stageHeader(4, "Frontend production bundle");

  let bundleResult: GateResult;

  if (stage3Failed) {
    bundleResult = skipped("bundle", "Production bundle integrity", "Stage 3 failed — skipping bundle check");
    pipelineFailed = true;
  } else {
    bundleResult = await runGate("bundle", "Production bundle integrity", "pnpm", ["--filter", "@workspace/scripts", "run", "check:bundle"]);
  }

  printResult(bundleResult);
  results.push(bundleResult);

  // ════════════════════════════════════════════════════════
  // FINAL REPORT
  // ════════════════════════════════════════════════════════
  const totalMs   = Date.now() - start;
  const allGates  = results.filter(r => r.name);
  const passed    = allGates.filter(r => r.passed).length;
  const failed    = allGates.filter(r => !r.passed && !r.skipped).length;
  const skippedN  = allGates.filter(r => r.skipped).length;
  const anyFailed = failed > 0;

  console.log(`\n  ${"═".repeat(58)}`);
  console.log(`  ${BOLD}Summary${RESET}  ${GREEN}${passed} passed${RESET}  ${failed > 0 ? RED : DIM}${failed} failed${RESET}  ${skippedN > 0 ? YELLOW : DIM}${skippedN} skipped${RESET}  ${DIM}${(totalMs / 1000).toFixed(1)}s total${RESET}`);
  console.log(`  ${"═".repeat(58)}\n`);

  if (anyFailed) {
    const failedGates = allGates.filter(r => !r.passed && !r.skipped);
    console.log(`  ${RED}${BOLD}Failed gates — output:${RESET}\n`);
    for (const r of failedGates) {
      console.log(`  ${RED}${BOLD}▶ ${r.label}${RESET}`);
      const tail = tailOutput(r.output);
      if (tail) console.log(tail);
      console.log();
    }
    console.log(`  ${RED}${BOLD}✗ Pipeline FAILED — deployment blocked.${RESET}\n`);
    process.exit(1);
  }

  console.log(`  ${GREEN}${BOLD}✓ Pipeline PASSED — safe to deploy.${RESET}\n`);
}

run().catch((err) => {
  console.error(`\n  Fatal pipeline error: ${err}\n`);
  process.exit(1);
});
