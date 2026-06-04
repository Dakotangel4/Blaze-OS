---
name: API server validation pattern
description: api-server uses @workspace/api-zod for input validation; bare zod/v4 import fails at build time.
---

## Rule
Never `import { z } from "zod/v4"` or `import { z } from "zod"` directly in `artifacts/api-server/src/routes/*.ts`. The esbuild bundler cannot resolve `zod/v4` subpath.

**Why:** The api-server uses `@workspace/api-zod` (at `lib/api-zod/`) for all shared schemas. Direct zod imports fail with `Could not resolve "zod/v4"` at build time.

**How to apply:**
- For new route schemas, add a new file in `lib/api-zod/src/` using `import * as zod from "zod"` (bare, not `zod/v4`).
- Export the new schemas from `lib/api-zod/src/index.ts`.
- Import in the route from `@workspace/api-zod`.
- The `lib/api-zod` package CAN use bare `zod` because it's in that package's own dependencies.

**Confirmed working pattern (trade screenshots):**
- `lib/api-zod/src/screenshots.ts` — defines schemas with `import * as zod from "zod"`
- `lib/api-zod/src/index.ts` — `export * from "./screenshots"`
- `artifacts/api-server/src/routes/screenshots.ts` — `import { CreateScreenshotBody, DeleteScreenshotParams } from "@workspace/api-zod"`
