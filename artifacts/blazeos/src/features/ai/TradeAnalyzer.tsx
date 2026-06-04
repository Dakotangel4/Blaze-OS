import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Shield, AlertTriangle, Lightbulb, Star } from "lucide-react";

export interface TradeAnalyzerInputs {
  symbol: string;
  direction: string;
  entry: string;
  exit: string;
  riskPercent: string;
  notes: string;
}

export interface TradeAnalyzerResult {
  tradeScore: number;
  scoreLabel: string;
  strengths: string[];
  mistakes: string[];
  riskAssessment: string;
  improvementSuggestions: string[];
}

interface Props {
  onSubmit: (inputs: Record<string, string>) => void;
  result: TradeAnalyzerResult | null;
  isLoading: boolean;
}

function ScoreMeter({ score }: { score: number }) {
  const color =
    score >= 8 ? "text-green-400" : score >= 5 ? "text-yellow-400" : "text-red-400";
  const bg =
    score >= 8 ? "bg-green-400/20 border-green-400/30" : score >= 5 ? "bg-yellow-400/20 border-yellow-400/30" : "bg-red-400/20 border-red-400/30";
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${bg}`}>
      <div className={`text-5xl font-black font-mono ${color}`}>{score}</div>
      <div>
        <div className={`text-xs font-mono font-bold tracking-widest ${color}`}>TRADE SCORE</div>
        <div className="text-foreground font-semibold">{score <= 10 ? "/ 10" : ""}</div>
        <div className={`text-sm font-mono font-bold mt-0.5 ${color}`}>{score <= 10 ? "" : ""}</div>
      </div>
      <div className="ml-auto">
        <div className={`text-sm font-bold font-mono tracking-widest px-3 py-1 rounded border ${bg} ${color}`}>
          {score <= 10 ? Array.from({ length: 10 }, (_, i) => i < score ? "█" : "░").join("") : ""}
        </div>
      </div>
    </div>
  );
}

export default function TradeAnalyzer({ onSubmit, result, isLoading }: Props) {
  const [inputs, setInputs] = useState<TradeAnalyzerInputs>({
    symbol: "",
    direction: "",
    entry: "",
    exit: "",
    riskPercent: "",
    notes: "",
  });

  const set = (k: keyof TradeAnalyzerInputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInputs((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      Symbol: inputs.symbol,
      Direction: inputs.direction,
      "Entry Price": inputs.entry,
      "Exit/Target Price": inputs.exit,
      "Risk %": inputs.riskPercent,
      "Trade Notes": inputs.notes,
    });
  };

  if (result && !isLoading) {
    return (
      <div className="space-y-4 font-mono">
        <ScoreMeter score={result.tradeScore} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold tracking-widest">
              <TrendingUp className="h-3.5 w-3.5" /> STRENGTHS
            </div>
            {result.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="text-green-400 shrink-0">▸</span> {s}
              </div>
            ))}
          </div>

          <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold tracking-widest">
              <AlertTriangle className="h-3.5 w-3.5" /> MISTAKES
            </div>
            {result.mistakes.length > 0 ? result.mistakes.map((m, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="text-red-400 shrink-0">▸</span> {m}
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">No significant mistakes identified.</div>
            )}
          </div>
        </div>

        <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold tracking-widest mb-2">
            <Shield className="h-3.5 w-3.5" /> RISK ASSESSMENT
          </div>
          <p className="text-sm text-foreground/80">{result.riskAssessment}</p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary text-xs font-bold tracking-widest">
            <Lightbulb className="h-3.5 w-3.5" /> IMPROVEMENT SUGGESTIONS
          </div>
          {result.improvementSuggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="text-primary shrink-0">{i + 1}.</span> {s}
            </div>
          ))}
        </div>

        <div className="text-center pt-1">
          <button
            onClick={() => onSubmit({})}
            className="text-xs text-muted-foreground hover:text-foreground font-mono underline underline-offset-2 transition-colors"
          >
            ← ANALYZE ANOTHER TRADE
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">SYMBOL</Label>
          <Input value={inputs.symbol} onChange={set("symbol")} placeholder="XAUUSD" required className="font-mono bg-background border-border" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">DIRECTION</Label>
          <Select value={inputs.direction} onValueChange={(v) => setInputs((p) => ({ ...p, direction: v }))}>
            <SelectTrigger className="font-mono bg-background border-border">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LONG">LONG</SelectItem>
              <SelectItem value="SHORT">SHORT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">ENTRY PRICE</Label>
          <Input value={inputs.entry} onChange={set("entry")} placeholder="2015.00" required className="font-mono bg-background border-border" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">EXIT / TARGET</Label>
          <Input value={inputs.exit} onChange={set("exit")} placeholder="2030.00" required className="font-mono bg-background border-border" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">RISK %</Label>
          <Input value={inputs.riskPercent} onChange={set("riskPercent")} placeholder="1.5" required className="font-mono bg-background border-border" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground tracking-widest">TRADE NOTES</Label>
        <Textarea value={inputs.notes} onChange={set("notes")} placeholder="Describe your reasoning, confluence factors, market context…" rows={4} className="font-mono text-sm bg-background border-border resize-none" />
      </div>
      <button
        type="submit"
        disabled={isLoading || !inputs.symbol || !inputs.direction}
        className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-mono font-bold text-sm tracking-widest rounded-md transition-colors"
      >
        {isLoading ? "ANALYZING…" : "▶ RUN ANALYSIS"}
      </button>
    </form>
  );
}
