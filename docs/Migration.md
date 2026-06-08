# BLAZE OS X — Migration & Merge Strategy

> Documents the merge of BlazeOS (trading OS) and Blaze Scalp Engine (SMC platform) into BLAZE OS X.

---

## 1. Source Repositories

| Repo | Primary Strength | Stack |
|---|---|---|
| **BlazeOS** | Full trading OS infrastructure — auth, DB, API, CI, deployment | React + Vite, Express 5, PostgreSQL + Drizzle, Replit Auth |
| **Blaze Scalp Engine** | Advanced SMC modules — sessions, playbooks, performance DNA, AI validator, psychology | React, session/kill-zone logic, chart patterns |

---

## 2. Merge Decision Matrix

| Area | Decision | Rationale |
|---|---|---|
| Auth | Keep BlazeOS (Replit Auth) | OIDC-based, session-in-DB, production-ready |
| Database | Keep BlazeOS (Drizzle + PostgreSQL) | Strongly typed, migration-friendly |
| API layer | Keep BlazeOS (Express 5 + OpenAPI codegen) | Contract-first design, type-safe across layers |
| UI system | Keep BlazeOS (Shadcn + Tailwind 4) | Consistent dark premium aesthetic |
| Frontend routing | Keep BlazeOS (wouter + lazy loading) | Code-split, bundle-optimized |
| AI tooling | Merge — extend BlazeOS AI Center | Added 3 chat assistants + 2 data tools |
| Sessions module | Migrate from Scalp Engine | Kill zones, UTC clock — ported to new arch |
| Playbooks module | Migrate from Scalp Engine | DB table added, CRUD API + UI ported |
| Performance DNA | Migrate from Scalp Engine | Charts wired to existing trades table analytics |
| Psychology tracker | Migrate from Scalp Engine | Journaling UI ported, DB ready for extension |
| AI Validator | Migrate from Scalp Engine | UI scaffolded, AI backend integration pending |
| Prop Firm Tracker | Replace BlazeOS version | New `prop_accounts` table, CRUD with drawdown bars |

---

## 3. Conflict Resolutions

### 3.1 Table Naming — `accounts` vs `prop_accounts`
**Conflict:** Scalp Engine used `accounts`; PostgreSQL reserves certain keywords.
**Resolution:** Table renamed to `prop_accounts`. TypeScript entity `accountsTable` preserved for compatibility.

### 3.2 Analytics Schema Mismatch
**Conflict:** Scalp Engine analytics used `pnlR` (R-multiples); BlazeOS trades table uses `pnl` (dollars).
**Resolution:** Analytics routes compute from `pnl` field. R-multiple display computed client-side where needed.

### 3.3 Auth Systems
**Conflict:** Scalp Engine used Supabase Auth; BlazeOS uses Replit Auth.
**Resolution:** Supabase client stubbed for compatibility; all auth flows use Replit Auth. Supabase dependency retained only for any legacy data utilities — service role key never referenced in API.

### 3.4 AI Tooling Architecture
**Conflict:** Scalp Engine had direct frontend AI calls; BlazeOS proxies through backend.
**Resolution:** All AI calls go through the backend proxy. No API keys in frontend bundle.

---

## 4. New Tables Added

```sql
-- Playbooks
CREATE TABLE playbooks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  timeframe TEXT,
  rules TEXT[],
  confluences TEXT[],
  min_rr NUMERIC(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prop Accounts
CREATE TABLE prop_accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  firm TEXT,
  account_type TEXT NOT NULL,
  account_size NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL,
  max_drawdown_pct NUMERIC NOT NULL,
  daily_drawdown_pct NUMERIC NOT NULL,
  profit_target_pct NUMERIC NOT NULL,
  phase TEXT NOT NULL DEFAULT 'challenge',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. New Routes Added

| Route | Module |
|---|---|
| `GET/POST/PUT/DELETE /accounts` | Prop firm account management |
| `GET/POST/PUT/DELETE /playbooks` | Strategy playbook management |
| `GET /analytics/equity-curve` | Equity curve from trades.pnl |
| `GET /analytics/session-performance` | Win rate by session |
| `GET /analytics/pair-performance` | Performance breakdown by symbol |
| `POST /ai/chat` | Conversational AI assistants |
| `POST /ai/journal-analysis` | Auto-pull trades + AI analysis |
| `POST /ai/knowledge-search` | Search notes + AI synthesis |

---

## 6. Dead Code Removed

- Duplicate auth utilities from Scalp Engine (replaced by Replit Auth)
- Supabase direct DB calls (replaced by Drizzle ORM)
- Redundant analytics computation logic (unified into `/analytics` routes)
- Standalone CSS files (replaced by Tailwind 4 utility classes)

---

## 7. Dependency Cleanup

| Package | Action | Reason |
|---|---|---|
| `@supabase/supabase-js` | Retained (stubbed) | Legacy compatibility; no service-role key used |
| `react-router-dom` | Removed | Replaced by wouter |
| Multiple chart libraries | Consolidated to recharts | Single charting solution |

---

## 8. Post-Merge Validation

All CI checks must pass after any merge:

```bash
pnpm run typecheck          # Zero TS errors
pnpm --filter @workspace/scripts run check:env
pnpm --filter @workspace/scripts run check:routes
pnpm --filter @workspace/scripts run check:bundle
pnpm --filter @workspace/scripts run check:integration
```
