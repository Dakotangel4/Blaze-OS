# BLAZE OS X — Architecture

> CTO Reference Document · v1.0 · June 2026

---

## 1. Product Overview

BLAZE OS X is a unified trading operating system built for elite traders. It merges two predecessor systems (BlazeOS trading OS and Blaze Scalp Engine) into a single, professionally-engineered SaaS platform. The product covers the full trade lifecycle: journaling, risk management, SMC strategy tools, prop firm tracking, session analysis, playbooks, performance analytics, AI tooling, and a knowledge vault.

---

## 2. System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    BLAZE OS X Platform                  │
│                                                         │
│  ┌───────────────────┐    ┌────────────────────────┐   │
│  │   Frontend SPA    │    │     API Server          │   │
│  │  React + Vite     │◄──►│   Express 5 + TS       │   │
│  │  Port :5000       │    │   Port :8080            │   │
│  └───────────────────┘    └────────────┬───────────┘   │
│                                        │               │
│                           ┌────────────▼───────────┐   │
│                           │   PostgreSQL DB         │   │
│                           │   (Replit managed)      │   │
│                           └────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │             AI Provider Layer (Backend Proxy)    │  │
│  │   OpenAI GPT-4o Mini · Claude 3.5 Haiku · Sonar │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

```
Browser → Vite Dev Server (:5000)
  └── /api/* → Proxy → Express API (:8080)
                 └── Replit Auth Middleware (replitAuth.ts)
                       └── Route Handler
                             ├── Drizzle ORM → PostgreSQL
                             └── AI Proxy → External AI APIs
```

---

## 3. Monorepo Structure

```
blaze-os-x/
├── artifacts/
│   ├── api-server/          # Express 5 backend
│   │   └── src/
│   │       ├── routes/      # All API route handlers
│   │       ├── lib/         # aiProviders.ts, replitAuth.ts
│   │       └── index.ts     # Server entry point
│   ├── blazeos/             # React + Vite frontend SPA
│   │   └── src/
│   │       ├── pages/       # All route-level page components
│   │       ├── components/  # Shared UI components + layout
│   │       └── features/    # Feature-scoped modules (ai/, etc.)
│   └── mockup-sandbox/      # UI development sandbox
├── lib/
│   ├── db/                  # Drizzle ORM schema + DB connection
│   │   └── src/schema/      # One file per domain entity
│   ├── api-spec/            # OpenAPI 3.1 spec (source of truth)
│   ├── api-client-react/    # Generated TanStack Query hooks
│   └── api-zod/             # Generated Zod validators + TS types
├── scripts/                 # CI checks (env, routes, bundle, integration)
└── docs/                    # Architecture + operational documentation
```

---

## 4. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 24.x |
| Language | TypeScript | 5.9 |
| Package manager | pnpm workspaces | 10.x |
| Frontend framework | React | 19.x |
| Frontend build | Vite | 7.x |
| Frontend routing | wouter | 3.x |
| State management | TanStack Query | 5.x |
| UI components | Shadcn UI + Radix | latest |
| Styling | Tailwind CSS | 4.x |
| Charts | Recharts | 2.x |
| Animations | Framer Motion | 12.x |
| Backend framework | Express | 5.x |
| ORM | Drizzle ORM | 0.44.x |
| Database | PostgreSQL | 16.x |
| Validation | Zod v4 + drizzle-zod | 3.24.x |
| Auth | Replit Auth (OIDC/passport) | — |
| API contract | OpenAPI 3.1 + Orval codegen | — |
| Backend build | esbuild | 0.27.x |
| Logging | pino + pino-http | 9.x |

---

## 5. Database Schema

All tables live in PostgreSQL, managed via Drizzle ORM. Schema files are in `lib/db/src/schema/`.

| Table | Domain | Key Columns |
|---|---|---|
| `users` | Auth | id, replitId, username, email, profileImage |
| `sessions` | Auth | id, userId, expiresAt |
| `trades` | Trading | symbol, direction, entry/exitPrice, riskPercent, pnl, result, session |
| `trade_screenshots` | Trading | tradeId, imageData, stage |
| `daily_bias` | Trading | date, bias, rationale, sessionPlan |
| `prop_accounts` | Trading | name, accountType, balance, drawdownLimit, currentDrawdown |
| `playbooks` | Strategy | name, description, rules, confluences, minRR |
| `notes` | Knowledge | title, category, content, tags, isPinned |
| `calendar_events` | Research | title, date, impact, currency, actual/forecast/previous |
| `clients` | CRM | name, email, stage, projectType, budget |
| `finances` | Business | type, category, amount, description, date |
| `user_settings` | System | openaiApiKey, claudeApiKey, perplexityApiKey, theme, timezone |

---

## 6. API Architecture

**Contract-First Design:** `lib/api-spec/openapi.yaml` is the single source of truth. The Orval codegen pipeline generates:
- `lib/api-client-react/src/generated/api.ts` — TanStack Query hooks
- `lib/api-zod/src/generated/` — Zod validators and TypeScript types

**Route Groups:**

| Prefix | Module |
|---|---|
| `/healthz` | Health check |
| `/dashboard` | Summary + daily bias |
| `/trades` | Trade CRUD + stats |
| `/analytics` | Equity curve, session/pair performance |
| `/accounts` | Prop firm accounts CRUD |
| `/playbooks` | Strategy playbooks CRUD |
| `/finances` | P&L tracker CRUD |
| `/clients` | CRM CRUD + pipeline |
| `/calendar` | Economic calendar CRUD |
| `/notes` | Knowledge vault CRUD |
| `/settings` | User preferences |
| `/ai` | AI tools, chat assistants, journal analysis, knowledge search |
| `/trade-screenshots` | Screenshot attachments |

---

## 7. AI Architecture

All AI provider calls are proxied through the backend. No API keys are exposed to the frontend.

**Tools (Structured JSON output):**
- `trade-analyzer` — scores a trade 1–10 with feedback
- `daily-bias` — generates institutional market briefing
- `journal-summary` — summarizes trading performance
- `client-proposal` — generates professional proposals

**Conversational Assistants (Free-form text):**
- `trading-assistant` — SMC/market structure coach
- `strategy-assistant` — playbook & confluence advisor
- `business-assistant` — prop firm & trading business advisor

**Data-Driven Analysis:**
- `POST /ai/journal-analysis` — auto-pulls last 90 trades, AI-generated pattern report
- `POST /ai/knowledge-search` — fuzzy search over knowledge vault + AI synthesis

**Supported Providers:** OpenAI GPT-4o Mini · Anthropic Claude 3.5 Haiku · Perplexity Sonar

---

## 8. Authentication

Replit Auth (OIDC/passport) handles all authentication:
- Session stored in `sessions` table (PostgreSQL)
- `replitAuth.ts` middleware validates `x-replit-user-id` headers
- All API routes except `/healthz` are protected
- Frontend redirects unauthenticated users to `/auth`

---

## 9. Frontend Architecture

**Routing:** wouter with lazy-loaded page components (code-split by Rollup)

**Navigation Groups:**
- **Trading:** Dashboard, Trading Hub, Journal, Risk Calculator, Sessions, Economic Calendar, Execution
- **Strategy:** Playbooks, AI Center, AI Validator, Knowledge Vault
- **Performance:** Analytics, Performance DNA, Psychology, Prop Firm Tracker
- **System:** Settings

**State:** TanStack Query for server state; React useState/useContext for local UI state

**Design System:** Shadcn UI + Tailwind 4, dark premium aesthetic, `#0a0a0f` base background, amber/orange primary accent

---

## 10. CI & Quality Gates

Scripts in `scripts/` run as Replit workflows:

| Check | What it verifies |
|---|---|
| `check:env` | Required env vars present |
| `check:routes` | All API routes respond with expected status |
| `check:bundle` | Production build succeeds, no secret leaks |
| `check:integration` | Replit Auth wired correctly, no Supabase leaks, AI calls proxied |
| `typecheck` | Full TypeScript strict mode across all packages |
| `ci` | All checks combined |
