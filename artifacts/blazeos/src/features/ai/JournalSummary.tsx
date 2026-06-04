import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";

export interface JournalSummaryInputs {
  dateRange: string;
  tradeHistory: string;
}

export interface JournalSummaryResult {
  winRate: string;
  averageRR: string;
  totalTrades: string;
  mostCommonMistake: string;
  bestPerformingSession: string;
  worstPerformingSession: string;
  improvementFocus: string;
  keyInsights: string[];
}

interface Props {
  onSubmit: (inputs: Record<string, string>) => void;
  result: JournalSummaryResult | null;
  isLoading: boolean;
}

interface StatCardProps {
  label: string;
  value: string;
  color?: string;
}

function StatCard({ label, value, color = "text-foreground" }: StatCardProps) {
  return (
    <div className="bg-background border border-border rounded-lg p-3 text-center">
      <div className="text-xs font-mono text-muted-foreground tracking-widest mb-1">{label}</div>
      <div className={`text-xl font-black font-mono ${color}`}>{value}</div>
    </div>
  );
}

export default function JournalSummary({ onSubmit, result, isLoading }: Props) {
  const [inputs, setInputs] = useState<JournalSummaryInputs>({
    dateRange: "",
    tradeHistory: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      "Date Range": inputs.dateRange,
      "Trade History": inputs.tradeHistory,
    });
  };

  if (result && !isLoading) {
    const winRateNum = parseFloat(result.winRate);
    const winColor = winRateNum >= 60 ? "text-green-400" : winRateNum >= 45 ? "text-yellow-400" : "text-red-400";

    return (
      <div className="space-y-4 font-mono">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="WIN RATE" value={result.winRate} color={winColor} />
          <StatCard label="AVG R:R" value={result.averageRR} color="text-primary" />
          <StatCard label="TOTAL TRADES" value={result.totalTrades} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold tracking-widest mb-2">
              <TrendingUp className="h-3.5 w-3.5" /> BEST SESSION
            </div>
            <p className="text-sm text-foreground/80">{result.bestPerformingSession}</p>
          </div>

          <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold tracking-widest mb-2">
              <TrendingDown className="h-3.5 w-3.5" /> WORST SESSION
            </div>
            <p className="text-sm text-foreground/80">{result.worstPerformingSession}</p>
          </div>
        </div>

        <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold tracking-widest mb-2">
            <AlertTriangle className="h-3.5 w-3.5" /> MOST COMMON MISTAKE
          </div>
          <p className="text-sm text-foreground/80">{result.mostCommonMistake}</p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-primary text-xs font-bold tracking-widest mb-2">
            <Lightbulb className="h-3.5 w-3.5" /> IMPROVEMENT FOCUS
          </div>
          <p className="text-sm text-foreground/80">{result.improvementFocus}</p>
        </div>

        {result.keyInsights?.length > 0 && (
          <div className="bg-white/[0.03] border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground text-xs font-bold tracking-widest mb-2">
              <BarChart3 className="h-3.5 w-3.5" /> KEY INSIGHTS
            </div>
            {result.keyInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="text-primary shrink-0">{i + 1}.</span> {insight}
              </div>
            ))}
          </div>
        )}

        <div className="text-center pt-1">
          <button
            onClick={() => onSubmit({})}
            className="text-xs text-muted-foreground hover:text-foreground font-mono underline underline-offset-2 transition-colors"
          >
            ← ANALYZE NEW PERIOD
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground tracking-widest">DATE RANGE</Label>
        <Input
          value={inputs.dateRange}
          onChange={(e) => setInputs((p) => ({ ...p, dateRange: e.target.value }))}
          placeholder="e.g. June 1–15, 2025"
          required
          className="font-mono bg-background border-border"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground tracking-widest">TRADE HISTORY</Label>
        <p className="text-[11px] text-muted-foreground/60 font-mono">
          Paste your trades: symbol, direction, entry, exit, P&L, outcome, notes
        </p>
        <Textarea
          value={inputs.tradeHistory}
          onChange={(e) => setInputs((p) => ({ ...p, tradeHistory: e.target.value }))}
          placeholder={"XAUUSD LONG 2010 → 2030, +$200, Win, London breakout\nNAS100 SHORT 18000 → 18100, -$100, Loss, FOMO entry..."}
          rows={8}
          required
          className="font-mono text-sm bg-background border-border resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !inputs.tradeHistory.trim()}
        className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-mono font-bold text-sm tracking-widest rounded-md transition-colors"
      >
        {isLoading ? "ANALYZING…" : "▶ GENERATE SUMMARY"}
      </button>
    </form>
  );
}
