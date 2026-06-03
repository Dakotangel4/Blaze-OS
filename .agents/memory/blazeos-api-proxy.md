---
name: BlazeOS Vite API proxy
description: Vite dev server must proxy /api to port 8080 for frontend→API-server communication.
---

## Rule
The BlazeOS Vite dev server does NOT have a built-in `/api` proxy. Any frontend code calling `/api/...` will 404 unless the proxy is present in `vite.config.ts`.

**Why:** The project uses two separate processes: Vite on port 3000 (frontend) and Express on port 8080 (API). Without the proxy, relative `/api` calls hit the Vite server which doesn't know about them.

**How to apply:** When adding new API routes consumed by the frontend, verify `vite.config.ts` has:
```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
      secure: false,
    },
  },
}
```
This was added during Finnhub/Settings integration. If the proxy is missing, all React Query calls to `/api/*` silently fail in dev.
