export type AIProvider = "openai" | "claude" | "perplexity";
export type AITool =
  | "trade-analyzer"
  | "daily-bias"
  | "journal-summary"
  | "client-proposal";

export type AIChatTool =
  | "trading-assistant"
  | "strategy-assistant"
  | "business-assistant";

export interface AIRunRequest {
  tool: AITool;
  provider: AIProvider;
  inputs: Record<string, string>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPTS: Record<AITool, string> = {
  "trade-analyzer": `You are an elite institutional trading coach analyzing a trade. 
Return ONLY a valid JSON object with this exact structure:
{
  "tradeScore": <number 1-10>,
  "scoreLabel": <"Weak Setup"|"Average Setup"|"Strong Setup"|"Elite Setup">,
  "strengths": [<string>, ...],
  "mistakes": [<string>, ...],
  "riskAssessment": <string>,
  "improvementSuggestions": [<string>, ...]
}
Be specific, data-driven, and professional. No markdown, no extra text — raw JSON only.`,

  "daily-bias": `You are an institutional market analyst generating a daily trading bias briefing.
Return ONLY a valid JSON object with this exact structure:
{
  "institutionalBias": <"STRONGLY BULLISH"|"BULLISH"|"NEUTRAL"|"BEARISH"|"STRONGLY BEARISH">,
  "biasRationale": <string>,
  "scalperBias": <string>,
  "liquidityTargets": [<string>, ...],
  "sessionPlan": <string>,
  "riskFactors": [<string>, ...]
}
Be specific and institutional in tone. No markdown, no extra text — raw JSON only.`,

  "journal-summary": `You are a professional trading performance coach analyzing a trader's journal.
Return ONLY a valid JSON object with this exact structure:
{
  "winRate": <string e.g. "67%">,
  "averageRR": <string e.g. "1:2.3">,
  "totalTrades": <string>,
  "mostCommonMistake": <string>,
  "bestPerformingSession": <string>,
  "worstPerformingSession": <string>,
  "improvementFocus": <string>,
  "keyInsights": [<string>, ...]
}
Be analytical and constructive. No markdown, no extra text — raw JSON only.`,

  "client-proposal": `You are a senior web agency consultant generating a professional client proposal.
Return ONLY a valid JSON object with this exact structure:
{
  "executiveSummary": <string>,
  "websiteProposal": <string>,
  "featuresList": [<string>, ...],
  "timeline": <string>,
  "pricingStructure": <string>,
  "deliverables": [<string>, ...],
  "nextSteps": <string>
}
Be professional and compelling. No markdown, no extra text — raw JSON only.`,
};

const CHAT_SYSTEM_PROMPTS: Record<AIChatTool, string> = {
  "trading-assistant": `You are BLAZE — an elite institutional trading coach and Smart Money Concepts (SMC) specialist. You help traders understand market structure, identify high-probability setups, manage risk, and develop a disciplined trading mindset.

Your expertise covers: Order blocks, Fair value gaps (FVGs), Liquidity sweeps, Change of character (CHoCH), Break of structure (BOS), Premium/Discount arrays, Kill zones (London, New York, Asian), HTF to LTF confluence, Risk management, Trade psychology.

Be direct, precise, and institutional in tone. Use proper SMC terminology. Give actionable advice. Keep responses concise unless depth is requested.`,

  "strategy-assistant": `You are BLAZE STRATEGY — an expert SMC strategy architect and playbook developer. You help traders define, refine, and systematize their trading strategies into repeatable, rule-based playbooks.

Your expertise covers: Setup definition, Entry/SL/TP rules, Confluence stacking, Timeframe alignment, Session timing, Setup grading criteria, Edge identification, Backtesting logic, Strategy journaling frameworks.

Help traders build objective, rule-based systems. Ask clarifying questions to sharpen strategy definitions. Be systematic and structured.`,

  "business-assistant": `You are BLAZE BUSINESS — an expert in trading business management, prop firm strategy, and trading career development. You help traders treat trading as a professional business.

Your expertise covers: Prop firm rules and strategies (FTMO, The Funded Trader, MyForexFunds, etc.), Drawdown management, Scaling plans, Profit withdrawal strategies, Tax considerations for traders, Building a trading business, Client acquisition for trading educators, CRM and business development for traders.

Be practical, numbers-focused, and business-minded. Help traders optimize their prop firm performance and trading income.`,
};

function buildUserPrompt(tool: AITool, inputs: Record<string, string>): string {
  const lines = Object.entries(inputs)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `Analyze the following data and return the JSON report:\n\n${lines}`;
}

async function callOpenAI(key: string, tool: AITool, inputs: Record<string, string>): Promise<unknown> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[tool] },
        { role: "user", content: buildUserPrompt(tool, inputs) },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return JSON.parse(data.choices[0].message.content);
}

async function callClaude(key: string, tool: AITool, inputs: Record<string, string>): Promise<unknown> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPTS[tool] + "\nIMPORTANT: Your entire response must be a single valid JSON object — no text before or after.",
      messages: [{ role: "user", content: buildUserPrompt(tool, inputs) }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
  const text = data.content.find((c) => c.type === "text")?.text ?? "{}";
  return JSON.parse(text.trim());
}

async function callPerplexity(key: string, tool: AITool, inputs: Record<string, string>): Promise<unknown> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[tool] },
        { role: "user", content: buildUserPrompt(tool, inputs) },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`Perplexity error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Perplexity response");
  return JSON.parse(jsonMatch[0]);
}

async function callOpenAIChat(key: string, systemPrompt: string, history: ChatMessage[], message: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

async function callClaudeChat(key: string, systemPrompt: string, history: ChatMessage[], message: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [...history, { role: "user", content: message }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

async function callPerplexityChat(key: string, systemPrompt: string, history: ChatMessage[], message: string): Promise<string> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Perplexity error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

export const PROVIDER_MODELS: Record<AIProvider, string> = {
  openai: "GPT-4o Mini",
  claude: "Claude 3.5 Haiku",
  perplexity: "Sonar",
};

export async function runAI(provider: AIProvider, key: string, tool: AITool, inputs: Record<string, string>): Promise<unknown> {
  switch (provider) {
    case "openai": return callOpenAI(key, tool, inputs);
    case "claude": return callClaude(key, tool, inputs);
    case "perplexity": return callPerplexity(key, tool, inputs);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function runAIChat(
  provider: AIProvider,
  key: string,
  tool: AIChatTool,
  message: string,
  history: ChatMessage[] = [],
): Promise<string> {
  const systemPrompt = CHAT_SYSTEM_PROMPTS[tool];
  switch (provider) {
    case "openai": return callOpenAIChat(key, systemPrompt, history, message);
    case "claude": return callClaudeChat(key, systemPrompt, history, message);
    case "perplexity": return callPerplexityChat(key, systemPrompt, history, message);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function runAIRaw(
  provider: AIProvider,
  key: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  switch (provider) {
    case "openai": return callOpenAIChat(key, systemPrompt, [], userMessage);
    case "claude": return callClaudeChat(key, systemPrompt, [], userMessage);
    case "perplexity": return callPerplexityChat(key, systemPrompt, [], userMessage);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
