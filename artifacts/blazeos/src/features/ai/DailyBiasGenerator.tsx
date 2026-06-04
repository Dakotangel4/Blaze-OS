import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, AlertTriangle, Map, TrendingUp } from "lucide-react";

export interface DailyBiasInputs {
  symbol: string;
  dxyBias: string;
  yieldBias: string;
  sentiment: string;
  notes: string;
}

export interface DailyBiasResult {
  institutionalBias: string;
  biasRationale: string;
  scalperBias: string;
  liquidityTargets: string[];
  sessionPlan: string;
  riskFactors: string[];
}

interface Props {
  onSubmit: (inputs: Record<string, string>) => void;
  result: DailyBiasResult | null;
  isLoading: boolean;
}

const BIAS_COLORS: Record<string, string> = {
  "STRONGLY BULLISH": "text-green-400 border-green-400/30 bg-green-400/10",
  "BULLISH": "text-green-300 border-green-300/30 bg-green-300/10",
  "NEUTRAL": "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  "BEARISH": "text-red-300 border-red-300/30 bg-red-300/10",
  "STRONGLY BEARISH": "text-red-400 border-red-400/30 bg-red-400/10",
};

export default function DailyBiasGenerator({ onSubmit, result, isLoading }: Props) {
  const [inputs, setInputs] = useState<DailyBiasInputs>({
    symbol: "",
    dxyBias: "",
    yieldBias: "",
    sentiment: "",
    notes: "",
  });

  const set = (k: keyof DailyBiasInputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInputs((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      Symbol: inputs.symbol,
      "DXY Bias": inputs.dxyBias,
      "Yield Bias": inputs.yieldBias,
      "Market Sentiment": inputs.sentiment,
      "Additional Notes": inputs.notes,
    });
  };

  if (result && !isLoading) {
    const biasStyle = BIAS_COLORS[result.institutionalBias] ?? "text-primary border-primary/30 bg-primary/10";
    return (
      <div className="space-y-4 font-mono">
        <div className={`border rounded-lg p-5 text-center ${biasStyle}`}>
          <div className="text-xs tracking-widest mb-1 opacity-70">INSTITUTIONAL BIAS</div>
          <div className="text-3xl font-black tracking-widest">{result.institutionalBias}</div>
          <div className="text-sm mt-2 opacity-80 font-sans">{result.biasRationale}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-primary text-xs font-bold tracking-widest mb-2">
              <TrendingUp className="h-3.5 w-3.5" /> SCALPER BIAS
            </div>
            <p className="text-sm text-foreground/80">{result.scalperBias}</p>
          </div>

          <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold tracking-widest mb-2">
              <Target className="h-3.5 w-3.5" /> LIQUIDITY TARGETS
            </div>
            <div className="space-y-1">
              {result.liquidityTargets.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="text-yellow-400 text-xs">◆</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-400/5 border border-blue-400/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-widest mb-2">
            <Map className="h-3.5 w-3.5" /> SESSION PLAN
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{result.sessionPlan}</p>
        </div>

        <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold tracking-widest">
            <AlertTriangle className="h-3.5 w-3.5" /> RISK FACTORS
          </div>
          {result.riskFactors.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="text-red-400 shrink-0">▸</span> {r}
            </div>
          ))}
        </div>

        <div className="text-center pt-1">
          <button
            onClick={() => onSubmit({})}
            className="text-xs text-muted-foreground hover:text-foreground font-mono underline underline-offset-2 transition-colors"
          >
            ← GENERATE NEW BIAS
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
          <Input value={inputs.symbol} onChange={set("symbol")} placeholder="NAS100" required className="font-mono bg-background border-border" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">DXY BIAS</Label>
          <Select value={inputs.dxyBias} onValueChange={(v) => setInputs((p) => ({ ...p, dxyBias: v }))}>
            <SelectTrigger className="font-mono bg-background border-border">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bullish">Bullish</SelectItem>
              <SelectItem value="Bearish">Bearish</SelectItem>
              <SelectItem value="Neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">YIELD BIAS</Label>
          <Select value={inputs.yieldBias} onValueChange={(v) => setInputs((p) => ({ ...p, yieldBias: v }))}>
            <SelectTrigger className="font-mono bg-background border-border">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rising">Rising</SelectItem>
              <SelectItem value="Falling">Falling</SelectItem>
              <SelectItem value="Flat">Flat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">MARKET SENTIMENT</Label>
          <Select value={inputs.sentiment} onValueChange={(v) => setInputs((p) => ({ ...p, sentiment: v }))}>
            <SelectTrigger className="font-mono bg-background border-border">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Risk-On">Risk-On</SelectItem>
              <SelectItem value="Risk-Off">Risk-Off</SelectItem>
              <SelectItem value="Mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground tracking-widest">ADDITIONAL CONTEXT</Label>
        <Textarea value={inputs.notes} onChange={set("notes")} placeholder="Key news events, overnight price action, notable levels…" rows={3} className="font-mono text-sm bg-background border-border resize-none" />
      </div>
      <button
        type="submit"
        disabled={isLoading || !inputs.symbol}
        className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-mono font-bold text-sm tracking-widest rounded-md transition-colors"
      >
        {isLoading ? "GENERATING…" : "▶ GENERATE BIAS"}
      </button>
    </form>
  );
}
