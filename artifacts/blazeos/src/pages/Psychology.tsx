import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, BarChart2, TrendingDown } from "lucide-react";

export default function Psychology() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Psychology</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Behavioral pattern detection</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="font-semibold">Coming Soon</div>
                <Badge variant="outline" className="border-primary/40 text-primary text-xs">Alpha</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Analyzes your trade history to detect FOMO, revenge trading, and overtrading patterns — then generates personalized coaching insights.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { icon: <AlertTriangle className="h-5 w-5" />, title: "FOMO Detection", desc: "Identifies trades taken outside your rules due to fear of missing out." },
          { icon: <TrendingDown className="h-5 w-5" />, title: "Revenge Trading Alerts", desc: "Detects oversized or rushed trades following consecutive losses." },
          { icon: <BarChart2 className="h-5 w-5" />, title: "Behavior Scoring", desc: "Daily psychology score based on rule compliance and emotional patterns." },
          { icon: <Brain className="h-5 w-5" />, title: "AI Coaching", desc: "Personalized notes like: \"You lose 68% more often after 2 consecutive wins.\"" },
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
