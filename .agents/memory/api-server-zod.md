---
name: API server validation pattern
description: api-server uses @workspace/api-zod for input validation; bare zod import fails at build time.
---

## Rule
Never `import { z } from "zod"` directly in `artifacts/api-server/src/routes/*.ts`. The esbuild bundler for api-server cannot resolve bare `zod` (it's not in api-server's package.json).

**Why:** The api-server uses `@workspace/api-zod` for all shared schemas and validation. Direct zod imports fail with `Could not resolve "zod"` at build time.

**How to apply:**
- Use `@workspace/api-zod` schemas if the type already exists.
- For ad-hoc validation in new routes, use manual TypeScript checks (`typeof body.field === "string"`) instead of zod.
- If zod is truly needed for a new route, add it to api-server's package.json dependencies first.
