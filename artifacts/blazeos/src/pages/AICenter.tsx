import { useState } from "react";
import { Bot, TrendingUp, Zap, FileText, Sparkles, ChevronRight, Settings as SettingsIcon } from "lucide-react";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runAITool, AI_MODEL_IDS, type AIProvider, type AITool } from "@/features/ai/aiService";
import TradeAnalyzer, { type TradeAnalyzerResult } from "@/features/ai/TradeAnalyzer";
import DailyBiasGenerator, { type DailyBiasResult } from "@/features/ai/DailyBiasGenerator";
import JournalSummary, { type JournalSummaryResult } from "@/features/ai/JournalSummary";
import ClientProposal, { type ClientProposalResult } from "@/features/ai/ClientProposal";

type AnyResult = TradeAnalyzerResult | DailyBiasResult | JournalSummaryResult | ClientProposalResult;
type Status = "READY" | "ANALYZING" | "COMPLETE" | "ERROR";

const TOOLS: { id: AITool; name: string; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "trade-analyzer", name: "Trade Analyzer", label: "TRADE ANALYZER", icon: TrendingUp, desc: "Score your trades with institutional-grade feedback." },
  { id: "daily-bias", name: "Daily Bias Generator", label: "DAILY BIAS", icon: Zap, desc: "Generate your institutional market briefing." },
  { id: "journal-summary", name: "Journal Summary", label: "JOURNAL SUMMARY", icon: FileText, desc: "Analyze your trading performance over a period." },
  { id: "client-proposal", name: "Client Proposal", label: "CLIENT PROPOSAL", icon: Sparkles, desc: "Generate professional client proposals instantly." },
];

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: "openai", label: "OpenAI GPT-4o Mini" },
  { id: "claude", label: "Claude 3.5 Haiku" },
  { id: "perplexity", label: "Perplexity Sonar" },
];

export default function AICenter() {
  const [activeTool, setActiveTool] = useState<AITool>("trade-analyzer");
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [status, setStatus] = useState<Status>("READY");
  const [result, setResult] = useState<AnyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTool = TOOLS.find((t) => t.id === activeTool)!;

  const handleSelectTool = (id: AITool) => {
    setActiveTool(id);
    setResult(null);
    setError(null);
    setStatus("READY");
  };

  const handleSubmit = async (inputs: Record<string, string>) => {
    if (Object.keys(inputs).length === 0) {
      setResult(null);
      setError(null);
      setStatus("READY");
      return;
    }
    setStatus("ANALYZING");
    setResult(null);
    setError(null);
    try {
      const res = await runAITool({ tool: activeTool, provider, inputs });
      setResult(res.result as unknown as AnyResult);
      setStatus("COMPLETE");
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === "NO_API_KEY") {
        setError(`No ${provider} API key configured. Add it in Settings → AI Providers.`);
      } else {
        setError(e.message ?? "AI request failed.");
      }
      setStatus("ERROR");
    }
  };

  const statusColor: Record<Status, string> = {
    READY: "text-muted-foreground",
    ANALYZING: "text-yellow-400",
    COMPLETE: "text-green-400",
    ERROR: "text-red-400",
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Command Center</h1>
            <p className="text-muted-foreground text-sm">Your institutional intelligence layer.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 font-mono text-xs">
          <span className="text-muted-foreground">MODEL: {AI_MODEL_IDS[provider]}</span>
          <span className={`font-bold tracking-widest ${statusColor[status]}`}>
            STATUS: {status}
            {status === "ANALYZING" && (
              <span className="inline-flex gap-0.5 ml-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-full md:w-52 shrink-0 space-y-2">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest">TOOLS</span>
            </div>
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors border-b border-border/50 last:border-0 ${
                  activeTool === tool.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <tool.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-left font-mono text-xs">{tool.name}</span>
                {activeTool === tool.id && <ChevronRight className="h-3 w-3 ml-auto" />}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest">PROVIDER</span>
            </div>
            <div className="p-2">
              <Select value={provider} onValueChange={(v) => setProvider(v as AIProvider)}>
                <SelectTrigger className="font-mono text-xs bg-background border-border h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="font-mono text-xs">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Link href="/settings">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg border border-border/50 transition-colors cursor-pointer">
              <SettingsIcon className="h-3.5 w-3.5" />
              Configure API Keys
            </div>
          </Link>
        </div>

        {/* Main Panel */}
        <div className="flex-1 min-h-0 bg-black/40 border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="shrink-0 px-4 py-2.5 border-b border-border bg-card/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 font-mono text-xs text-muted-foreground tracking-widest">{currentTool.label}</span>
            </div>
            <div className="md:hidden font-mono text-[10px]">
              <span className={`font-bold ${statusColor[status]}`}>● {status}</span>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 md:p-6">
              {status === "READY" && !result && (
                <div className="mb-5 font-mono text-xs text-muted-foreground border-b border-border pb-4">
                  <span className="text-primary">▶</span> {currentTool.desc}
                </div>
              )}

              {status === "ERROR" && error && (
                <div className="mb-4 bg-red-400/10 border border-red-400/30 rounded-lg p-4 font-mono text-sm text-red-400">
                  <div className="text-xs font-bold tracking-widest mb-1">ERROR</div>
                  {error}
                  {error.includes("API key") && (
                    <Link href="/settings">
                      <span className="block mt-2 text-primary underline underline-offset-2 cursor-pointer">→ Go to Settings to add your API key</span>
                    </Link>
                  )}
                </div>
              )}

              {status === "ANALYZING" && (
                <div className="mb-4 font-mono text-sm text-yellow-400 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  ANALYZING INPUT — PLEASE WAIT
                </div>
              )}

              {activeTool === "trade-analyzer" && (
                <TradeAnalyzer onSubmit={handleSubmit} result={result as TradeAnalyzerResult | null} isLoading={status === "ANALYZING"} />
              )}
              {activeTool === "daily-bias" && (
                <DailyBiasGenerator onSubmit={handleSubmit} result={result as DailyBiasResult | null} isLoading={status === "ANALYZING"} />
              )}
              {activeTool === "journal-summary" && (
                <JournalSummary onSubmit={handleSubmit} result={result as JournalSummaryResult | null} isLoading={status === "ANALYZING"} />
              )}
              {activeTool === "client-proposal" && (
                <ClientProposal onSubmit={handleSubmit} result={result as ClientProposalResult | null} isLoading={status === "ANALYZING"} />
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
