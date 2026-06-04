import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { userSettingsTable } from "@workspace/db";
import {
  runAI,
  PROVIDER_MODELS,
  type AIProvider,
  type AITool,
} from "../lib/aiProviders";

const router: IRouter = Router();

const VALID_PROVIDERS: AIProvider[] = ["openai", "claude", "perplexity"];
const VALID_TOOLS: AITool[] = [
  "trade-analyzer",
  "daily-bias",
  "journal-summary",
  "client-proposal",
];

router.post("/ai/run", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const provider = body.provider as AIProvider;
  const tool = body.tool as AITool;
  const inputs = body.inputs as Record<string, string>;

  if (!VALID_PROVIDERS.includes(provider)) {
    res.status(400).json({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}` });
    return;
  }
  if (!VALID_TOOLS.includes(tool)) {
    res.status(400).json({ error: `Invalid tool. Must be one of: ${VALID_TOOLS.join(", ")}` });
    return;
  }
  if (!inputs || typeof inputs !== "object") {
    res.status(400).json({ error: "inputs must be an object" });
    return;
  }

  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .orderBy(desc(userSettingsTable.id))
    .limit(1);

  const KEY_MAP: Record<AIProvider, string | null | undefined> = {
    openai: settings?.openaiApiKey,
    claude: settings?.claudeApiKey,
    perplexity: settings?.perplexityApiKey,
  };

  const key = KEY_MAP[provider];
  if (!key) {
    res.status(422).json({
      error: `No API key configured for ${provider}. Add it in Settings → AI Providers.`,
      code: "NO_API_KEY",
    });
    return;
  }

  try {
    const result = await runAI(provider, key, tool, inputs);
    res.json({
      result,
      provider,
      model: PROVIDER_MODELS[provider],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    res.status(502).json({ error: message });
  }
});

export default router;
