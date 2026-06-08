import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Eye, TrendingUp, Zap } from "lucide-react";

export default function AIValidator() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">AI Validator</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Chart screenshot analysis & setup scoring</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="font-semibold">Coming Soon</div>
                <Badge variant="outline" className="border-primary/40 text-primary text-xs">Beta</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a chart screenshot and our AI will analyze market structure, identify key levels, and validate your setup before you trade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { icon: <Eye className="h-5 w-5" />, title: "Vision Analysis", desc: "Instant AI analysis of BOS, CHOCH, FVGs, and Order Blocks from your chart screenshot." },
          { icon: <TrendingUp className="h-5 w-5" />, title: "Bias Detection", desc: "AI identifies bullish or bearish bias and suggests liquidity targets and key levels." },
          { icon: <Zap className="h-5 w-5" />, title: "Entry Validation", desc: "Suggested entry, SL, and TP levels with a confidence score based on SMC principles." },
          { icon: <Cpu className="h-5 w-5" />, title: "Setup Scoring", desc: "Every setup scored 0–100 based on confluence, risk, and playbook alignment." },
        ].map((f) => (
          <Card key={f.title} className="border-border/40 opacity-60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">{f.icon}</div>
                <div className="font-medium text-sm">{f.title}</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
