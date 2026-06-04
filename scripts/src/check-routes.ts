/**
 * BlazeOS — Route Health Gate
 *
 * Builds the API server, starts it on an ephemeral port, probes critical
 * HTTP endpoints, then shuts it down cleanly.  Exits 1 if any endpoint
 * fails or the server doesn't start within the timeout.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT        = path.resolve(fileURLToPath(import.meta.url), "../../..");
const API_DIR     = path.join(ROOT, "artifacts/api-server");
const TEST_PORT   = 19_876;
const START_MS    = 15_000;  // max wait for server to be ready
const PROBE_MS    = 5_000;   // per-request timeout

const RED   = "\x1b[31m";
const GREEN = "\x1b[32m";
const DIM   = "\x1b[2m";
const BOLD  = "\x1b[1m";
const RESET = "\x1b[0m";

interface ProbeResult {
  route:   string;
  status:  number | "error";
  ok:      boolean;
  body?:   string;
  error?:  string;
  ms:      number;
}

async function probe(route: string, expectStatus = 200): Promise<ProbeResult> {
  const url  = `http://127.0.0.1:${TEST_PORT}${route}`;
  const t0   = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_MS);
    const res   = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const body = await res.text().catch(() => "");
    const ms   = Date.now() - t0;
    const ok   = res.status === expectStatus;
    return { route, status: res.status, ok, body: body.slice(0, 200), ms };
  } catch (err) {
    const ms = Date.now() - t0;
    return { route, status: "error", ok: false, error: String(err), ms };
  }
}

async function waitForServer(maxMs: number): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://127.0.0.1:${TEST_PORT}/api/healthz`);
      if (r.ok) return true;
    } catch { /* not ready yet */ }
    await sleep(300);
  }
  return false;
}

async function run() {
  console.log(`\n${BOLD}BlazeOS — Route Health Check${RESET}\n${"─".repeat(50)}`);

  // ── 1. Build the server ────────────────────────────────────────────────
  console.log(`\n  Building API server…`);
  const build = spawn("pnpm", ["run", "build"], {
    cwd: API_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  let buildOut = "";
  build.stdout?.on("data", (d: Buffer) => { buildOut += d.toString(); });
  build.stderr?.on("data", (d: Buffer) => { buildOut += d.toString(); });

  const buildCode = await new Promise<number>((res) => build.on("close", res));
  if (buildCode !== 0) {
    console.log(`\n  ${RED}✗ Build failed (exit ${buildCode})${RESET}`);
    console.log(buildOut.split("\n").map(l => `    ${l}`).join("\n"));
    process.exit(1);
  }
  console.log(`  ${GREEN}✓${RESET} Build succeeded`);

  // ── 2. Start the server ────────────────────────────────────────────────
  console.log(`  Starting server on port ${TEST_PORT}…`);
  const server: ChildProcess = spawn(
    "node",
    ["--enable-source-maps", "./dist/index.mjs"],
    {
      cwd: API_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PORT:        String(TEST_PORT),
        NODE_ENV:    "production",
      },
    },
  );

  let serverLog = "";
  server.stdout?.on("data", (d: Buffer) => { serverLog += d.toString(); });
  server.stderr?.on("data", (d: Buffer) => { serverLog += d.toString(); });

  let serverDied = false;
  let serverCode = 0;
  server.on("close", (code) => { serverDied = true; serverCode = code ?? 1; });

  const ready = await waitForServer(START_MS);

  if (!ready || serverDied) {
    server.kill("SIGKILL");
    const snippet = serverLog.split("\n").slice(-20).map(l => `    ${l}`).join("\n");
    console.log(`\n  ${RED}✗ Server did not start within ${START_MS}ms (exit ${serverCode})${RESET}`);
    console.log(snippet);
    process.exit(1);
  }
  console.log(`  ${GREEN}✓${RESET} Server is up`);

  // ── 3. Probe routes ────────────────────────────────────────────────────
  console.log(`\n  Probing routes:`);

  const probes: Array<[string, number]> = [
    ["/api/healthz",                200],
    ["/api/trades",                 401],   // requires auth — must NOT be 500
    ["/api/settings",               401],
    ["/api/auth/user",              401],
    ["/api/ai/run",                 401],
    ["/api/nonexistent-route-xyz",  401],   // auth middleware fires before 404 on protected servers
  ];

  const results: ProbeResult[] = [];
  for (const [route, expect] of probes) {
    const r = await probe(route, expect);
    results.push(r);
    const icon = r.ok ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const statusStr = String(r.status).padEnd(4);
    console.log(`    ${icon} ${r.ok ? GREEN : RED}${statusStr}${RESET}  ${route.padEnd(35)} ${DIM}${r.ms}ms${RESET}`);
    if (!r.ok) {
      if (r.error) console.log(`         ${DIM}error: ${r.error}${RESET}`);
      else         console.log(`         ${DIM}body: ${r.body}${RESET}`);
    }
  }

  // Validate healthz response body
  const health = results.find(r => r.route === "/api/healthz");
  if (health?.ok) {
    try {
      const parsed = JSON.parse(health.body ?? "{}");
      if (parsed.status === "ok") {
        console.log(`\n  ${GREEN}✓${RESET} /api/healthz body: ${DIM}${JSON.stringify(parsed)}${RESET}`);
      } else {
        console.log(`\n  ${RED}✗ /api/healthz returned unexpected body: ${health.body}${RESET}`);
        results.push({ route: "/api/healthz body", status: 200, ok: false, ms: 0 });
      }
    } catch {
      console.log(`\n  ${RED}✗ /api/healthz body is not valid JSON: ${health.body}${RESET}`);
      results.push({ route: "/api/healthz body", status: 200, ok: false, ms: 0 });
    }
  }

  // ── 4. Shut down ───────────────────────────────────────────────────────
  server.kill("SIGTERM");
  await sleep(500);
  if (!serverDied) server.kill("SIGKILL");

  // ── 5. Report ──────────────────────────────────────────────────────────
  const failures = results.filter(r => !r.ok);
  if (failures.length > 0) {
    console.log(`\n  ${RED}${BOLD}${failures.length} route(s) failed:${RESET}`);
    for (const f of failures) {
      console.log(`    ${RED}•${RESET} ${f.route} — got ${f.status}, expected ok`);
    }
    process.exit(1);
  }

  console.log(`\n  ${GREEN}${BOLD}All routes healthy.${RESET}\n`);
}

run().catch(err => {
  console.error(`\n  Fatal: ${err}\n`);
  process.exit(1);
});
