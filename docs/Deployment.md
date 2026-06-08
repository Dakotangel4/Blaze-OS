# BLAZE OS X — Deployment Guide

---

## 1. Environments

| Environment | URL | Notes |
|---|---|---|
| Development | `https://<repl>.replit.dev` | Vite HMR on :5000, API on :8080 |
| Production | `https://<app>.replit.app` | Single Node.js process serves built assets |

---

## 2. Development

### Start all services

The Replit environment manages two workflows:

| Workflow | Command | Port |
|---|---|---|
| API Server | `PORT=8080 pnpm --filter @workspace/api-server dev` | 8080 |
| BlazeOS | `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/blazeos dev` | 5000 |

The Vite dev server proxies `/api/*` → `http://localhost:8080`.

### Database changes

```bash
# After editing lib/db/src/schema/*.ts
pnpm --filter @workspace/db run push

# Verify schema applied
pnpm --filter @workspace/scripts run check:db
```

### API contract changes

```bash
# After editing lib/api-spec/openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Verify generated files updated
ls lib/api-client-react/src/generated/
ls lib/api-zod/src/generated/
```

---

## 3. Production Deployment

BLAZE OS X deploys as a Replit Autoscale Deployment.

### Pre-deployment checklist

```bash
# 1. All CI checks pass
pnpm --filter @workspace/scripts run ci

# 2. Full typecheck
pnpm run typecheck

# 3. Build both artifacts
pnpm --filter @workspace/api-server run build
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/blazeos run build

# 4. Bundle integrity
pnpm --filter @workspace/scripts run check:bundle
```

### Deployment process

1. Open **Deployments** tab in Replit
2. Choose **Autoscale** deployment type
3. Set **Run command:** `node artifacts/api-server/dist/index.mjs`
4. Set **Build command:** `pnpm run build`
5. Confirm environment variables are set (see `Environment.md`)
6. Click **Deploy**

### Production architecture

In production, the Express server serves the pre-built Vite `dist/public/` as static files. The single process handles both API and frontend on the same port.

```
Request → Express
  ├── /api/*  → Route handlers
  └── /*      → Serve dist/public/index.html (SPA)
```

---

## 4. Database Migrations

Drizzle uses a `push` strategy in development:

```bash
pnpm --filter @workspace/db run push
```

For production schema changes:
1. Update schema file in `lib/db/src/schema/`
2. Run `pnpm --filter @workspace/db run push` (connects to `DATABASE_URL`)
3. Verify with `pnpm --filter @workspace/scripts run check:db`

**Never delete columns without first deprecating them** — this can break running production instances.

---

## 5. Health Checks

The API exposes `GET /healthz` which returns `{ status: "ok", timestamp }`. The deployment platform polls this endpoint.

---

## 6. Rollback

Replit maintains automatic checkpoints. To rollback:
1. Open **History** in the Replit editor
2. Select the checkpoint before the breaking change
3. Click **Restore**

---

## 7. Monitoring

- **Server logs:** Available in Replit Deployments → Logs tab
- **Error tracking:** pino structured logging; filter by `level: "error"`
- **Bundle monitoring:** `pnpm --filter @workspace/scripts run check:bundle` scans for secret leaks and validates chunk sizes
