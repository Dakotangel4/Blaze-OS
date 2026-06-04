---
name: Supabase SSR Architecture
description: How Supabase auth is wired between Vite SPA and Express API in BlazeOS
---

## Architecture

This is NOT Next.js — it's a Vite SPA + Express API. The "SSR patterns" are adapted accordingly:

| SSR concept | BlazeOS equivalent |
|---|---|
| `utils/supabase/client.ts` | `artifacts/blazeos/src/utils/supabase/client.ts` — `createBrowserClient` from `@supabase/ssr` |
| `utils/supabase/server.ts` (frontend) | `artifacts/blazeos/src/utils/supabase/server.ts` — `getAuthHeaders()` + `apiFetch()` for manual Express API calls |
| `utils/supabase/middleware.ts` | `artifacts/blazeos/src/utils/supabase/middleware.ts` — `useRequireAuth` hook, `withAuth` HOC |
| Next.js middleware | `artifacts/api-server/src/middlewares/auth.ts` — Express `requireAuth` + `optionalAuth` |
| Server-side Supabase client | `artifacts/api-server/src/utils/supabase/server.ts` — `verifyToken(accessToken)` via `supabase.auth.getUser()` |

## Token flow

1. `AuthContext.tsx` calls `setAuthTokenGetter` at MODULE level (runs on import, before React renders)
2. The getter: `async () => supabase.auth.getSession().then(s => s.data.session?.access_token ?? null)`
3. Every generated `@workspace/api-client-react` hook calls `customFetch` which attaches the JWT via `Authorization: Bearer <token>`
4. Express `requireAuth` middleware verifies the JWT via `supabase.auth.getUser(token)` on each request
5. Verified `User` is attached to `req.user` for route handlers

## Auth middleware in app.ts

```ts
app.use("/api", (req, res, next) => {
  if (req.path === "/healthz") return next(); // skip auth for health check — route is /api/healthz
  return requireAuth(req, res, next);
});
```

Note: `req.path` inside `app.use("/api", ...)` is the path AFTER `/api`, so `/health` correctly matches `/api/health`.

## Env vars

- Frontend (injected via Vite define): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Source in vite.config.ts: `process.env.SUPABASE_URL` → `import.meta.env.VITE_SUPABASE_URL`
  - NOT `NEXT_PUBLIC_*` — this is Vite, not Next.js
- Backend (Express): `process.env.SUPABASE_URL`, `process.env.SUPABASE_ANON_KEY`

## Google OAuth

Enabled in both SignIn and SignUp forms via `supabase.auth.signInWithOAuth({ provider: "google" })`.
Requires Google provider to be enabled in Supabase dashboard + app URL added to allowed redirect URLs.
Redirect goes to: `${window.location.origin}/dashboard`

## Route protection

- Canonical auth route: `/login` (also `/sign-in` kept for compat)
- Protected routes redirect to `/login` when unauthenticated
- `ProtectedRoute` shows `AuthLoadingScreen` spinner while `loading = true`
- `useRequireAuth` hook + `withAuth` HOC in middleware.ts for programmatic use

**Why:** The user requested Next.js SSR patterns but the stack is Vite SPA + Express. The adaptation keeps the same file structure and semantics but implemented correctly for this stack.
