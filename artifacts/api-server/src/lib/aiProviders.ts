export type AIProvider = "openai" | "claude" | "perplexity";
export type AITool =
  | "trade-analyzer"
  | "daily-bias"
  | "journal-summary"
  | "client-proposal";

export interface AIRunRequest {
  tool: AITool;
  provider: AIProvider;
  inputs: Record<string, string>;
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

function buildUserPrompt(tool: AITool, inputs: Record<string, string>): string {
  const lines = Object.entries(inputs)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `Analyze the following data and return the JSON report:\n\n${lines}`;
}

async function callOpenAI(
  key: string,
  tool: AITool,
  inputs: Record<string, string>,
): Promise<unknown> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return JSON.parse(data.choices[0].message.content);
}

async function callClaude(
  key: string,
  tool: AITool,
  inputs: Record<string, string>,
): Promise<unknown> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system:
        SYSTEM_PROMPTS[tool] +
        "\nIMPORTANT: Your entire response must be a single valid JSON object — no text before or after.",
      messages: [
        { role: "user", content: buildUserPrompt(tool, inputs) },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error ${res.status}: ${err}`);
  }
  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const text = data.content.find((c) => c.type === "text")?.text ?? "{}";
  return JSON.parse(text.trim());
}

async function callPerplexity(
  key: string,
  tool: AITool,
  inputs: Record<string, string>,
): Promise<unknown> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity error ${res.status}: ${err}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const raw = data.choices[0].message.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Perplexity response");
  return JSON.parse(jsonMatch[0]);
}

export const PROVIDER_MODELS: Record<AIProvider, string> = {
  openai: "GPT-4o Mini",
  claude: "Claude 3.5 Haiku",
  perplexity: "Sonar",
};

export async function runAI(
  provider: AIProvider,
  key: string,
  tool: AITool,
  inputs: Record<string, string>,
): Promise<unknown> {
  switch (provider) {
    case "openai":
      return callOpenAI(key, tool, inputs);
    case "claude":
      return callClaude(key, tool, inputs);
    case "perplexity":
      return callPerplexity(key, tool, inputs);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
