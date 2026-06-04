---
name: AI Command Center architecture
description: How BlazeOS AI Command Center is wired — key storage, provider abstraction, result casting.
---

## Key storage
AI provider keys (OpenAI, Claude, Perplexity) are stored in `user_settings` DB columns (`openai_api_key`, `claude_api_key`, `perplexity_api_key`). Keys never reach the browser. Backend reads them at request time.

## Provider abstraction
`artifacts/api-server/src/lib/aiProviders.ts` contains `runAI(provider, key, tool, inputs)`. Each tool has a system prompt that requests JSON-only output. Perplexity response needs a regex JSON extraction since it doesn't support `response_format`.

## Route
`POST /api/ai/run` — body: `{ tool, provider, inputs }`. Returns `{ result, provider, model }` or `422` with `code: "NO_API_KEY"` if key missing.

## Frontend
`src/features/ai/aiService.ts` is a thin fetch wrapper. `AICenter.tsx` renders one of 4 tool components based on `activeTool`. Tool components handle their own input forms and output display.

## TypeScript gotcha
Casting `res.result` (type `Record<string,unknown>`) to a union result type requires going through `unknown` first: `res.result as unknown as AnyResult`. Direct cast fails with TS2352.

**Why:** TypeScript won't allow narrowing from a wide record type to a specific interface union without the intermediate `unknown` cast.
