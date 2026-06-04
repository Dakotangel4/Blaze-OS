---
name: Replit Auth migration
description: How Supabase Auth was replaced with Replit Auth in BlazeOS — OIDC setup, session storage, schema changes, and frontend patterns.
---

# Replit Auth Migration

Supabase Auth (JWT Bearer tokens) was fully replaced with Replit Auth (OIDC + express-session + passport).

## Key changes

- `artifacts/api-server/src/utils/replitAuth.ts` — setupAuth, isAuthenticated, getSession. Uses openid-client/passport, memoizee for OIDC discovery, connect-pg-simple for session store.
- `artifacts/api-server/src/app.ts` — now exports `createApp()` (async) to await setupAuth before registering routes.
- `lib/db/src/schema/auth.ts` — adds `sessions` and `users` tables (mandatory for Replit Auth).
- `artifacts/blazeos/src/contexts/AuthContext.tsx` — now fetches `/api/auth/user` via cookie, no Supabase dependency.
- Supabase client files (`utils/supabase/client.ts`, `helpers.ts`, `server.ts`) are stubbed out for backward compat.
- Landing page auth links changed from `/sign-in`/`/sign-up` to `/api/login`.
- Screenshot upload moved from Supabase Storage to local disk (`uploads/screenshots/`), served via `/api/trade-screenshots/file/:filename`.

## User object shape (from Replit session claims)

```ts
{ id: string; email?: string; firstName?: string; lastName?: string; profileImageUrl?: string }
```

Access in routes: `(req.user as Record<string,unknown>)["claims"]["sub"]`

## Why

Supabase Auth required external SUPABASE_URL/SUPABASE_ANON_KEY env vars and JWT Bearer tokens. Replit Auth is fully managed, uses cookies, and requires no external credentials.

**How to apply:** Any new protected route should use `isAuthenticated` from `./utils/replitAuth`. Get userId from `(req.user as any).claims.sub`.
