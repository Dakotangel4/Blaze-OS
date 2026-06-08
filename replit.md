# BLAZE OS X

A unified trading OS merging BlazeOS and Blaze Scalp Engine into a single platform. Covers full trade lifecycle: journaling, risk management, SMC strategy tools, prop firm tracking, session analysis, playbooks, performance analytics, AI tooling, and a knowledge vault.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + TanStack Query + wouter + Shadcn UI + Tailwind 4 + Recharts + Framer Motion

## Where things live

- `artifacts/blazeos/src/pages/` — all frontend pages
- `artifacts/api-server/src/routes/` — all API routes
- `lib/db/src/schema/` — Drizzle ORM schema files (source of truth for DB)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/api.ts` — generated TanStack Query hooks
- `lib/api-zod/src/generated/` — generated Zod validators

## Architecture decisions

- All AI provider calls are proxied through the backend — no keys leak to the frontend
- Replit Auth (OIDC/passport) replaces Supabase Auth; session stored in DB `sessions` table
- OpenAPI spec → Orval codegen is the contract boundary between frontend and backend
- Prop firm accounts use table `prop_accounts` (not `accounts`) to avoid any PostgreSQL reserved-word issues
- New DB tables added: `playbooks`, `prop_accounts`

## Product

**Trading:** Dashboard command center, Trade journal (log with symbol/direction/entry/SL/TP/result/session), Risk Calculator, Session tracker (live UTC clock with kill zones), Economic Calendar, Execution checklist.

**Strategy:** Playbooks (define setups with rules + min R:R), AI Center (OpenAI/Claude/Perplexity), AI Validator (coming soon), Knowledge Vault (notes by category).

**Performance:** Analytics, Performance DNA (equity curve, drawdown, session/pair breakdown), Psychology tracker (coming soon), Prop Firm tracker (CRUD accounts with drawdown progress bars).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after changing DB schema files
- The analytics routes (`/api/trades/equity-curve`, `/api/trades/session-performance`, `/api/trades/pair-performance`) compute from the existing `trades` table using `pnl` (dollars) and `result = 'Win'`
- Vite dev server proxies `/api` → `http://localhost:8080`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
