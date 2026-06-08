import { Router, type IRouter } from "express";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@workspace/db";
import { userSettingsTable, tradesTable, notesTable } from "@workspace/db";
import {
  runAI,
  runAIChat,
  runAIRaw,
  PROVIDER_MODELS,
  type AIProvider,
  type AITool,
  type AIChatTool,
  type ChatMessage,
} from "../lib/aiProviders";

const router: IRouter = Router();

const VALID_PROVIDERS: AIProvider[] = ["openai", "claude", "perplexity"];
const VALID_TOOLS: AITool[] = ["trade-analyzer", "daily-bias", "journal-summary", "client-proposal"];
const VALID_CHAT_TOOLS: AIChatTool[] = ["trading-assistant", "strategy-assistant", "business-assistant"];

async function getApiKey(provider: AIProvider): Promise<string | null | undefined> {
  const [settings] = await db.select().from(userSettingsTable).orderBy(desc(userSettingsTable.id)).limit(1);
  const KEY_MAP: Record<AIProvider, string | null | undefined> = {
    openai: settings?.openaiApiKey,
    claude: settings?.claudeApiKey,
    perplexity: settings?.perplexityApiKey,
  };
  return KEY_MAP[provider];
}

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

  const key = await getApiKey(provider);
  if (!key) {
    res.status(422).json({ error: `No API key configured for ${provider}. Add it in Settings → AI Providers.`, code: "NO_API_KEY" });
    return;
  }

  try {
    const result = await runAI(provider, key, tool, inputs);
    res.json({ result, provider, model: PROVIDER_MODELS[provider] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    res.status(502).json({ error: message });
  }
});

router.post("/ai/chat", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const provider = body.provider as AIProvider;
  const tool = body.tool as AIChatTool;
  const message = body.message as string;
  const history = (body.history ?? []) as ChatMessage[];

  if (!VALID_PROVIDERS.includes(provider)) {
    res.status(400).json({ error: `Invalid provider` });
    return;
  }
  if (!VALID_CHAT_TOOLS.includes(tool)) {
    res.status(400).json({ error: `Invalid chat tool. Must be one of: ${VALID_CHAT_TOOLS.join(", ")}` });
    return;
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const key = await getApiKey(provider);
  if (!key) {
    res.status(422).json({ error: `No API key configured for ${provider}. Add it in Settings → AI Providers.`, code: "NO_API_KEY" });
    return;
  }

  try {
    const reply = await runAIChat(provider, key, tool, message, history);
    res.json({ reply, provider, model: PROVIDER_MODELS[provider] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI chat failed";
    res.status(502).json({ error: message });
  }
});

router.post("/ai/journal-analysis", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const provider = (body.provider as AIProvider) ?? "openai";

  if (!VALID_PROVIDERS.includes(provider)) {
    res.status(400).json({ error: `Invalid provider` });
    return;
  }

  const key = await getApiKey(provider);
  if (!key) {
    res.status(422).json({ error: `No API key configured for ${provider}. Add it in Settings → AI Providers.`, code: "NO_API_KEY" });
    return;
  }

  const trades = await db
    .select()
    .from(tradesTable)
    .orderBy(desc(tradesTable.createdAt))
    .limit(90);

  if (trades.length === 0) {
    res.status(422).json({ error: "No trades found in your journal. Log some trades first.", code: "NO_DATA" });
    return;
  }

  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const avgPnl = totalPnl / trades.length;

  const sessionCounts: Record<string, { wins: number; total: number }> = {};
  const symbolCounts: Record<string, { wins: number; total: number; pnl: number }> = {};

  for (const t of trades) {
    if (!sessionCounts[t.session]) sessionCounts[t.session] = { wins: 0, total: 0 };
    sessionCounts[t.session].total++;
    if (t.result === "Win") sessionCounts[t.session].wins++;

    if (!symbolCounts[t.symbol]) symbolCounts[t.symbol] = { wins: 0, total: 0, pnl: 0 };
    symbolCounts[t.symbol].total++;
    if (t.result === "Win") symbolCounts[t.symbol].wins++;
    symbolCounts[t.symbol].pnl += t.pnl ?? 0;
  }

  const setupBreakdown = trades.reduce<Record<string, number>>((acc, t) => {
    acc[t.setupType] = (acc[t.setupType] ?? 0) + 1;
    return acc;
  }, {});

  const journalData = {
    totalTrades: trades.length,
    wins,
    losses,
    winRate: `${Math.round((wins / trades.length) * 100)}%`,
    totalPnl: `$${totalPnl.toFixed(2)}`,
    avgPnlPerTrade: `$${avgPnl.toFixed(2)}`,
    sessionBreakdown: Object.entries(sessionCounts)
      .map(([s, v]) => `${s}: ${v.wins}W/${v.total - v.wins}L (${Math.round((v.wins / v.total) * 100)}% WR)`)
      .join(", "),
    topSymbols: Object.entries(symbolCounts)
      .sort((a, b) => b[1].pnl - a[1].pnl)
      .slice(0, 5)
      .map(([sym, v]) => `${sym}: ${v.wins}W/${v.total - v.wins}L, $${v.pnl.toFixed(0)} PnL`)
      .join("; "),
    setupTypes: Object.entries(setupBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([s, c]) => `${s}(${c})`)
      .join(", "),
    recentTrades: trades
      .slice(0, 10)
      .map((t) => `${t.symbol} ${t.direction} | ${t.result} | $${(t.pnl ?? 0).toFixed(0)} | ${t.setupType} | ${t.session}`)
      .join("\n"),
  };

  const systemPrompt = `You are an elite trading performance coach with deep expertise in SMC and institutional trading. Analyze the trader's journal data and return a comprehensive, actionable performance report as a JSON object with this exact structure:
{
  "overallRating": "Needs Work"|"Developing"|"Consistent"|"Elite",
  "headline": "<one-line summary of the trader's current state>",
  "winRateAnalysis": "<string>",
  "profitabilityAnalysis": "<string>",
  "bestPattern": "<string — what this trader does best>",
  "criticalWeakness": "<string — the single biggest issue to fix>",
  "sessionInsight": "<string — which session to focus on and why>",
  "symbolInsight": "<string — best/worst pairs and recommendations>",
  "psychologyNote": "<string — mindset observation from the data>",
  "topPriorities": ["<string>", "<string>", "<string>"],
  "weeklyTarget": "<string — one concrete goal for the next 7 days>"
}
Be specific, use the actual numbers from the data, and be direct. No padding. Return raw JSON only.`;

  const userMessage = `Analyze this trading journal data:\n\n${Object.entries(journalData).map(([k, v]) => `${k}: ${v}`).join("\n")}`;

  try {
    const reply = await runAIRaw(provider, key, systemPrompt, userMessage);
    let parsed: unknown;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { headline: reply };
    } catch {
      parsed = { headline: reply };
    }
    res.json({ result: parsed, provider, model: PROVIDER_MODELS[provider], tradeCount: trades.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Journal analysis failed";
    res.status(502).json({ error: message });
  }
});

router.post("/ai/knowledge-search", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const query = body.query as string;
  const provider = (body.provider as AIProvider) ?? "openai";

  if (!query || !query.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }
  if (!VALID_PROVIDERS.includes(provider)) {
    res.status(400).json({ error: `Invalid provider` });
    return;
  }

  const key = await getApiKey(provider);
  if (!key) {
    res.status(422).json({ error: `No API key configured for ${provider}. Add it in Settings → AI Providers.`, code: "NO_API_KEY" });
    return;
  }

  const notes = await db
    .select()
    .from(notesTable)
    .where(
      or(
        ilike(notesTable.title, `%${query}%`),
        ilike(notesTable.content, `%${query}%`),
        ilike(notesTable.tags, `%${query}%`),
        ilike(notesTable.category, `%${query}%`),
      ),
    )
    .limit(10);

  if (notes.length === 0) {
    res.json({ notes: [], synthesis: "No matching notes found in your knowledge vault for that query. Try different keywords or add more notes.", query });
    return;
  }

  const noteSummaries = notes
    .map((n, i) => `[${i + 1}] "${n.title}" (${n.category})\n${n.content.slice(0, 300)}${n.content.length > 300 ? "..." : ""}`)
    .join("\n\n");

  const userMessage = `Search query: "${query}"\n\nMatching notes from knowledge vault:\n\n${noteSummaries}\n\nSynthesize the key insights from these notes relevant to the query in 2-3 sentences. Be direct and actionable.`;

  try {
    const synthesis = await runAIChat(provider, key, "strategy-assistant", userMessage, []);
    res.json({ notes, synthesis, query });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Knowledge search failed";
    res.status(502).json({ error: message, notes, synthesis: null, query });
  }
});

export default router;
