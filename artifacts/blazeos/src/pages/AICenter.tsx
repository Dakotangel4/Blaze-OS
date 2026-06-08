import { useState } from "react";
import {
  Bot, TrendingUp, Zap, FileText, Sparkles, ChevronRight,
  Settings as SettingsIcon, MessageSquare, BookOpen, BarChart2,
  Briefcase, Search, Brain, Loader2, AlertCircle, Star,
} from "lucide-react";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  runAITool, runJournalAnalysis, runKnowledgeSearch,
  AI_MODEL_IDS, CHAT_TOOL_LABELS,
  type AIProvider, type AITool, type AIChatTool,
  type JournalAnalysisResult, type KnowledgeNote,
} from "@/features/ai/aiService";
import TradeAnalyzer, { type TradeAnalyzerResult } from "@/features/ai/TradeAnalyzer";
import DailyBiasGenerator, { type DailyBiasResult } from "@/features/ai/DailyBiasGenerator";
import JournalSummary, { type JournalSummaryResult } from "@/features/ai/JournalSummary";
import ClientProposal, { type ClientProposalResult } from "@/features/ai/ClientProposal";
import AIChat from "@/features/ai/AIChat";

type AnyResult = TradeAnalyzerResult | DailyBiasResult | JournalSummaryResult | ClientProposalResult;
type Status = "READY" | "ANALYZING" | "COMPLETE" | "ERROR";

type TabId = AITool | AIChatTool | "knowledge-search" | "journal-analysis";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  group: "tools" | "assistants" | "data";
  desc: string;
}

const TABS: Tab[] = [
  { id: "trade-analyzer", label: "Trade Analyzer", icon: TrendingUp, group: "tools", desc: "Score your trades with institutional-grade AI feedback." },
  { id: "daily-bias", label: "Daily Bias", icon: Zap, group: "tools", desc: "Generate your institutional market briefing." },
  { id: "journal-summary", label: "Journal Summary", icon: FileText, group: "tools", desc: "Analyze your trading performance over a period." },
  { id: "client-proposal", label: "Client Proposal", icon: Sparkles, group: "tools", desc: "Generate professional client proposals instantly." },
  { id: "trading-assistant", label: "Trading Assistant", icon: MessageSquare, group: "assistants", desc: "Elite SMC trading coach. Ask about setups, structure, risk." },
  { id: "strategy-assistant", label: "Strategy Assistant", icon: BookOpen, group: "assistants", desc: "Build and refine your playbooks and trading systems." },
  { id: "business-assistant", label: "Business Assistant", icon: Briefcase, group: "assistants", desc: "Prop firm strategy, scaling plans, and trading business advice." },
  { id: "knowledge-search", label: "Knowledge Search", icon: Search, group: "data", desc: "Semantic search over your knowledge vault with AI synthesis." },
  { id: "journal-analysis", label: "Journal Analysis", icon: BarChart2, group: "data", desc: "Auto-pull your last 90 trades and get a deep AI performance report." },
];

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: "openai", label: "OpenAI GPT-4o Mini" },
  { id: "claude", label: "Claude 3.5 Haiku" },
  { id: "perplexity", label: "Perplexity Sonar" },
];

const CHAT_TOOLS = new Set<TabId>(["trading-assistant", "strategy-assistant", "business-assistant"]);
const DATA_TOOLS = new Set<TabId>(["knowledge-search", "journal-analysis"]);
const AI_TOOLS = new Set<TabId>(["trade-analyzer", "daily-bias", "journal-summary", "client-proposal"]);

const RATING_COLOR: Record<string, string> = {
  "Needs Work": "text-red-400",
  "Developing": "text-yellow-400",
  "Consistent": "text-blue-400",
  "Elite": "text-green-400",
};

export default function AICenter() {
  const [activeTab, setActiveTab] = useState<TabId>("trading-assistant");
  const [provider, setProvider] = useState<AIProvider>("openai");

  const [status, setStatus] = useState<Status>("READY");
  const [result, setResult] = useState<AnyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [journalStatus, setJournalStatus] = useState<Status>("READY");
  const [journalResult, setJournalResult] = useState<JournalAnalysisResult | null>(null);
  const [journalError, setJournalError] = useState<string | null>(null);
  const [journalTradeCount, setJournalTradeCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<Status>("READY");
  const [searchNotes, setSearchNotes] = useState<KnowledgeNote[]>([]);
  const [searchSynthesis, setSearchSynthesis] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const handleSelectTab = (id: TabId) => {
    setActiveTab(id);
    setResult(null);
    setError(null);
    setStatus("READY");
  };

  const handleToolSubmit = async (inputs: Record<string, string>) => {
    if (Object.keys(inputs).length === 0) { setResult(null); setError(null); setStatus("READY"); return; }
    setStatus("ANALYZING"); setResult(null); setError(null);
    try {
      const res = await runAITool({ tool: activeTab as AITool, provider, inputs });
      setResult(res.result as unknown as AnyResult);
      setStatus("COMPLETE");
    } catch (err) {
      const e = err as Error & { code?: string };
      setError(e.code === "NO_API_KEY" ? `No ${provider} API key configured. Add it in Settings → AI Providers.` : (e.message ?? "AI request failed."));
      setStatus("ERROR");
    }
  };

  const handleJournalAnalysis = async () => {
    setJournalStatus("ANALYZING"); setJournalResult(null); setJournalError(null);
    try {
      const res = await runJournalAnalysis(provider);
      setJournalResult(res.result as JournalAnalysisResult);
      setJournalTradeCount(res.tradeCount);
      setJournalStatus("COMPLETE");
    } catch (err) {
      const e = err as Error & { code?: string };
      setJournalError(e.code === "NO_API_KEY" ? `No ${provider} API key configured. Add it in Settings → AI Providers.` : e.code === "NO_DATA" ? "No trades found. Log some trades in your journal first." : (e.message ?? "Analysis failed."));
      setJournalStatus("ERROR");
    }
  };

  const handleKnowledgeSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchStatus("ANALYZING"); setSearchNotes([]); setSearchSynthesis(null); setSearchError(null);
    try {
      const res = await runKnowledgeSearch(searchQuery, provider);
      setSearchNotes(res.notes);
      setSearchSynthesis(res.synthesis);
      setSearchStatus("COMPLETE");
    } catch (err) {
      const e = err as Error & { code?: string };
      setSearchError(e.code === "NO_API_KEY" ? `No ${provider} API key configured.` : (e.message ?? "Search failed."));
      setSearchStatus("ERROR");
    }
  };

  const statusColor: Record<Status, string> = {
    READY: "text-muted-foreground",
    ANALYZING: "text-yellow-400",
    COMPLETE: "text-green-400",
    ERROR: "text-red-400",
  };

  const groups: { id: string; label: string; icon: React.ElementType }[] = [
    { id: "tools", label: "AI TOOLS", icon: Brain },
    { id: "assistants", label: "ASSISTANTS", icon: MessageSquare },
    { id: "data", label: "DATA INTEL", icon: BarChart2 },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 max-w-7xl mx-auto">
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
          {AI_TOOLS.has(activeTab) && (
            <span className={`font-bold tracking-widest ${statusColor[status]}`}>
              STATUS: {status}
              {status === "ANALYZING" && (
                <span className="inline-flex gap-0.5 ml-1">
                  {[0, 1, 2].map((i) => <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 150}ms` }}>.</span>)}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className="w-full md:w-56 shrink-0 space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-border flex items-center gap-1.5">
                <group.icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest">{group.label}</span>
              </div>
              {TABS.filter((t) => t.group === group.id).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors border-b border-border/50 last:border-0 ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-left font-mono text-xs truncate">{tab.label}</span>
                  {activeTab === tab.id && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          ))}

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
          {/* Panel Header */}
          <div className="shrink-0 px-4 py-2.5 border-b border-border bg-card/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
              <currentTab.icon className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
              <span className="ml-1 font-mono text-xs text-muted-foreground tracking-wider uppercase">{currentTab.label}</span>
            </div>
            {CHAT_TOOLS.has(activeTab) && (
              <span className="font-mono text-[10px] text-primary/60 tracking-widest">LIVE CHAT</span>
            )}
          </div>

          {/* AI Tools Panel */}
          {AI_TOOLS.has(activeTab) && (
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6">
                {status === "READY" && !result && (
                  <div className="mb-5 font-mono text-xs text-muted-foreground border-b border-border pb-4">
                    <span className="text-primary">▶</span> {currentTab.desc}
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
                {activeTab === "trade-analyzer" && <TradeAnalyzer onSubmit={handleToolSubmit} result={result as TradeAnalyzerResult | null} isLoading={status === "ANALYZING"} />}
                {activeTab === "daily-bias" && <DailyBiasGenerator onSubmit={handleToolSubmit} result={result as DailyBiasResult | null} isLoading={status === "ANALYZING"} />}
                {activeTab === "journal-summary" && <JournalSummary onSubmit={handleToolSubmit} result={result as JournalSummaryResult | null} isLoading={status === "ANALYZING"} />}
                {activeTab === "client-proposal" && <ClientProposal onSubmit={handleToolSubmit} result={result as ClientProposalResult | null} isLoading={status === "ANALYZING"} />}
              </div>
            </ScrollArea>
          )}

          {/* Chat Assistants Panel */}
          {CHAT_TOOLS.has(activeTab) && (
            <AIChat
              key={activeTab}
              tool={activeTab as AIChatTool}
              provider={provider}
              placeholder={
                activeTab === "trading-assistant"
                  ? "Ask about setups, SMC, market structure, risk..."
                  : activeTab === "strategy-assistant"
                  ? "Ask about playbooks, rules, confluences, edge..."
                  : "Ask about prop firm rules, scaling, business strategy..."
              }
            />
          )}

          {/* Journal Analysis Panel */}
          {activeTab === "journal-analysis" && (
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6 space-y-4">
                <div className="font-mono text-xs text-muted-foreground border-b border-border pb-4">
                  <span className="text-primary">▶</span> {currentTab.desc}
                </div>

                {journalStatus !== "ANALYZING" && (
                  <Button
                    onClick={handleJournalAnalysis}
                    className="bg-primary hover:bg-primary/90 font-mono text-xs tracking-wider"
                  >
                    <BarChart2 className="h-3.5 w-3.5 mr-2" />
                    {journalStatus === "COMPLETE" ? "RE-ANALYZE JOURNAL" : "ANALYZE MY JOURNAL"}
                  </Button>
                )}

                {journalStatus === "ANALYZING" && (
                  <div className="flex items-center gap-3 font-mono text-sm text-yellow-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    PULLING TRADES AND ANALYZING...
                  </div>
                )}

                {journalStatus === "ERROR" && journalError && (
                  <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 font-mono text-sm text-red-400">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-widest mb-1">
                      <AlertCircle className="h-3.5 w-3.5" /> ERROR
                    </div>
                    {journalError}
                    {journalError.includes("API key") && (
                      <Link href="/settings">
                        <span className="block mt-2 text-primary underline underline-offset-2 cursor-pointer">→ Configure API Keys in Settings</span>
                      </Link>
                    )}
                  </div>
                )}

                {journalStatus === "COMPLETE" && journalResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-2xl font-bold ${RATING_COLOR[journalResult.overallRating] ?? "text-foreground"}`}>
                          {journalResult.overallRating}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">{journalResult.headline}</div>
                      </div>
                      <div className="text-right font-mono text-xs text-muted-foreground">
                        <div className="text-foreground font-bold text-lg">{journalTradeCount}</div>
                        <div>trades analyzed</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: "Win Rate Analysis", value: journalResult.winRateAnalysis },
                        { label: "Profitability", value: journalResult.profitabilityAnalysis },
                        { label: "Best Pattern", value: journalResult.bestPattern, positive: true },
                        { label: "Critical Weakness", value: journalResult.criticalWeakness, negative: true },
                        { label: "Session Insight", value: journalResult.sessionInsight },
                        { label: "Symbol Insight", value: journalResult.symbolInsight },
                        { label: "Psychology Note", value: journalResult.psychologyNote },
                        { label: "Weekly Target", value: journalResult.weeklyTarget, highlight: true },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-lg p-3 border text-sm ${
                            item.positive
                              ? "bg-green-500/5 border-green-500/20"
                              : item.negative
                              ? "bg-red-500/5 border-red-500/20"
                              : item.highlight
                              ? "bg-primary/5 border-primary/20"
                              : "bg-white/[0.03] border-white/[0.08]"
                          }`}
                        >
                          <div className={`font-mono text-[10px] tracking-widest mb-1.5 ${
                            item.positive ? "text-green-400" : item.negative ? "text-red-400" : item.highlight ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {item.label.toUpperCase()}
                          </div>
                          <div className="text-foreground/90 leading-relaxed">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {journalResult.topPriorities?.length > 0 && (
                      <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4">
                        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Star className="h-3 w-3" /> TOP PRIORITIES
                        </div>
                        <div className="space-y-2">
                          {journalResult.topPriorities.map((p, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-sm">
                              <span className="shrink-0 font-mono text-primary font-bold">{i + 1}.</span>
                              <span className="text-foreground/90">{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Knowledge Search Panel */}
          {activeTab === "knowledge-search" && (
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6 space-y-4">
                <div className="font-mono text-xs text-muted-foreground border-b border-border pb-4">
                  <span className="text-primary">▶</span> {currentTab.desc}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleKnowledgeSearch()}
                    placeholder="Search your knowledge vault..."
                    className="bg-white/[0.04] border-white/[0.1] font-mono text-sm placeholder:text-muted-foreground/50"
                    disabled={searchStatus === "ANALYZING"}
                  />
                  <Button
                    onClick={handleKnowledgeSearch}
                    className="bg-primary hover:bg-primary/90 shrink-0 font-mono text-xs"
                    disabled={!searchQuery.trim() || searchStatus === "ANALYZING"}
                  >
                    {searchStatus === "ANALYZING" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  </Button>
                </div>

                {searchStatus === "ERROR" && searchError && (
                  <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 font-mono text-sm text-red-400">{searchError}</div>
                )}

                {searchStatus === "COMPLETE" && (
                  <div className="space-y-4">
                    {searchSynthesis && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <div className="font-mono text-[10px] tracking-widest text-primary mb-2 flex items-center gap-1.5">
                          <Bot className="h-3 w-3" /> AI SYNTHESIS
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{searchSynthesis}</p>
                      </div>
                    )}

                    {searchNotes.length > 0 ? (
                      <div className="space-y-2">
                        <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                          {searchNotes.length} MATCHING NOTE{searchNotes.length !== 1 ? "S" : ""}
                        </div>
                        {searchNotes.map((note) => (
                          <div key={note.id} className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm">{note.title}</span>
                              <Badge variant="outline" className="text-[10px] font-mono shrink-0">{note.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{note.content}</p>
                            {note.tags && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {note.tags.split(",").map((tag) => (
                                  <span key={tag} className="text-[10px] font-mono text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground font-mono text-xs">
                        No matching notes found. Try different keywords.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
