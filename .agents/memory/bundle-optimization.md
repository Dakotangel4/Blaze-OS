---
name: Bundle optimization & lazy routing
description: Rollup manualChunks setup for pnpm workspaces, lazy loading with wouter, and Supabase client defensive init pattern.
---

## Rollup manualChunks for pnpm
In pnpm, module IDs include the store path like `.pnpm/react@19.x/node_modules/react/`. Matching on `/react/`, `@radix-ui/`, etc. works reliably. Key chunks: `vendor-react`, `vendor-supabase`, `vendor-charts` (recharts+d3, ~418 kB), `vendor-motion` (framer-motion), `vendor-ui` (radix), `vendor-icons` (lucide), `vendor-query` (tanstack), `vendor-utils`.

**Why:** Before splitting, the single bundle was 1,491 kB. After: largest chunk is 418 kB (charts), initial bootstrap ~65 kB. Vendor chunks are cached indefinitely; only app code changes bust the cache.

**How to apply:** Set `build.chunkSizeWarningLimit: 600` alongside `manualChunks` to suppress warnings for the charts chunk (recharts+d3 is inherently large and cannot be split further without removing functionality).

## Lazy loading with wouter
BlazeOS uses `wouter`, not React Router. Use `React.lazy()` + `Suspense` around page components in `ProtectedRoute`. The `ProtectedRoute` prop type should be `React.ElementType` (not `React.ComponentType`) to accept `LazyExoticComponent` without casting. Pass a `label` string for the `ErrorBoundary pageName` since lazy components don't have `.name` at runtime.

**Why:** `LazyExoticComponent<T>` is not directly assignable to `ComponentType<T>` in React's type system.

## Supabase client defensive initialization
`createClient("", "")` throws at module load time if env vars are missing. Guard with:
```ts
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseConfigured ? createClient(...) : null as unknown as ...;
```
Then check `supabaseConfigured` in `App` before mounting the full app, and guard `setAuthTokenGetter` in `main.tsx`.

**Why:** Without this, a missing `VITE_SUPABASE_ANON_KEY` causes an uncaught exception that replaces the entire app with a Vite error overlay, giving no actionable info to the user.
