# BLAZE OS X — Environment Variables

---

## Required Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/dbname` |

The `DATABASE_URL` is automatically provisioned by Replit's built-in PostgreSQL integration.

---

## Optional Variables (AI Features)

AI provider keys are stored **per-user in the `user_settings` DB table** and managed through the **Settings → AI Providers** UI. They do not need to be set as environment variables.

However, if you want to pre-configure a global fallback key, you can set:

| Variable | Provider |
|---|---|
| `OPENAI_API_KEY` | OpenAI GPT-4o Mini |
| `ANTHROPIC_API_KEY` | Anthropic Claude 3.5 Haiku |
| `PERPLEXITY_API_KEY` | Perplexity Sonar |

---

## Build-time Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `8080` |
| `BASE_PATH` | Frontend base path | `/` |
| `NODE_ENV` | Environment mode | `development` / `production` |

---

## Replit Auth Variables

Set automatically by Replit's OIDC integration. Do not set manually:

| Variable | Set By |
|---|---|
| `REPL_ID` | Replit platform |
| `REPLIT_DOMAINS` | Replit platform |
| `SESSION_SECRET` | Replit platform |
| `ISSUER_URL` | Replit platform |

---

## Security Rules

1. **Never commit `.env` files** — use Replit Secrets for all credentials
2. **Never set AI provider keys as frontend env vars** — all AI calls are proxied through the backend
3. **Never expose `DATABASE_URL` to the frontend** — it is server-side only
4. The `check:bundle` CI script scans the production JS bundle for leaked secrets. This check **blocks deployment** if any key pattern is found.

---

## Local Development

For local development outside Replit, create a `.env` file (gitignored):

```bash
DATABASE_URL=postgres://localhost:5432/blazeosx
NODE_ENV=development
PORT=8080
```

The Vite dev server reads `VITE_*` prefixed variables only. All backend config is read server-side via `process.env`.

---

## Adding New Environment Variables

1. Add to `scripts/src/check-env.ts` so the CI env check validates it
2. Add to this document
3. Set in Replit Secrets (not in code)
4. For frontend access, prefix with `VITE_` and access via `import.meta.env.VITE_*`
