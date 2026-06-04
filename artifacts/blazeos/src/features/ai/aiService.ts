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

export interface AIRunResponse<T = Record<string, unknown>> {
  result: T;
  provider: AIProvider;
  model: string;
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

export async function runAITool<T = Record<string, unknown>>(
  request: AIRunRequest,
): Promise<AIRunResponse<T>> {
  const res = await fetch("/api/ai/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = data as { error?: string; code?: string };
    const error = new Error(err.error ?? "AI request failed") as Error & {
      code?: string;
    };
    error.code = err.code;
    throw error;
  }

  return data as AIRunResponse<T>;
}
