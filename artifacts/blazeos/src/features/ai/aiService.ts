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

export interface AIRunResponse<T = Record<string, unknown>> {
  result: T;
  provider: AIProvider;
  model: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIChatRequest {
  tool: AIChatTool;
  provider: AIProvider;
  message: string;
  history?: ChatMessage[];
}

export interface AIChatResponse {
  reply: string;
  provider: AIProvider;
  model: string;
}

export interface JournalAnalysisResult {
  overallRating: "Needs Work" | "Developing" | "Consistent" | "Elite";
  headline: string;
  winRateAnalysis: string;
  profitabilityAnalysis: string;
  bestPattern: string;
  criticalWeakness: string;
  sessionInsight: string;
  symbolInsight: string;
  psychologyNote: string;
  topPriorities: string[];
  weeklyTarget: string;
}

export interface KnowledgeNote {
  id: number;
  title: string;
  category: string;
  content: string;
  tags: string | null;
}

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI GPT-4o Mini",
  claude: "Claude 3.5 Haiku",
  perplexity: "Perplexity Sonar",
};

export const AI_MODEL_IDS: Record<AIProvider, string> = {
  openai: "BLAZE-GPT4o-MINI",
  claude: "BLAZE-CLAUDE-HAIKU",
  perplexity: "BLAZE-SONAR",
};

export const CHAT_TOOL_LABELS: Record<AIChatTool, string> = {
  "trading-assistant": "Trading Assistant",
  "strategy-assistant": "Strategy Assistant",
  "business-assistant": "Business Assistant",
};

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = data as { error?: string; code?: string };
    const error = new Error(err.error ?? "Request failed") as Error & { code?: string };
    error.code = err.code;
    throw error;
  }
  return data as T;
}

export async function runAITool<T = Record<string, unknown>>(
  request: AIRunRequest,
): Promise<AIRunResponse<T>> {
  return apiPost<AIRunResponse<T>>("/api/ai/run", request);
}

export async function runAIChat(request: AIChatRequest): Promise<AIChatResponse> {
  return apiPost<AIChatResponse>("/api/ai/chat", request);
}

export async function runJournalAnalysis(provider: AIProvider): Promise<{
  result: JournalAnalysisResult;
  provider: AIProvider;
  model: string;
  tradeCount: number;
}> {
  return apiPost("/api/ai/journal-analysis", { provider });
}

export async function runKnowledgeSearch(query: string, provider: AIProvider): Promise<{
  notes: KnowledgeNote[];
  synthesis: string | null;
  query: string;
}> {
  return apiPost("/api/ai/knowledge-search", { query, provider });
}
