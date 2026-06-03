import { useMarketData } from "@/hooks/useMarketData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface IntelRow {
  label: string;
  value: string;
  sentiment: "bullish" | "bearish" | "neutral";
}

export function MarketIntel() {
  const { data } = useMarketData();

  const btcChange = data.btcusd?.percent ?? 0;
  const nasChange = data.nas100?.percent ?? 0;
  const xauChange = data.xauusd?.percent ?? 0;

  const rows: IntelRow[] = [
    {
      label: "Gold (XAU)",
      value: xauChange >= 0 ? `+${xauChange.toFixed(2)}%` : `${xauChange.toFixed(2)}%`,
      sentiment: xauChange > 0.1 ? "bullish" : xauChange < -0.1 ? "bearish" : "neutral",
    },
    {
      label: "NAS100",
      value: nasChange >= 0 ? `+${nasChange.toFixed(2)}%` : `${nasChange.toFixed(2)}%`,
      sentiment: nasChange > 0.1 ? "bullish" : nasChange < -0.1 ? "bearish" : "neutral",
    },
    {
      label: "Bitcoin",
      value: btcChange >= 0 ? `+${btcChange.toFixed(2)}%` : `${btcChange.toFixed(2)}%`,
      sentiment: btcChange > 0.5 ? "bullish" : btcChange < -0.5 ? "bearish" : "neutral",
    },
    {
      label: "Risk Mode",
      value: nasChange > 0 && btcChange > 0 ? "Risk-On" : nasChange < 0 && btcChange < 0 ? "Risk-Off" : "Mixed",
      sentiment: nasChange > 0 && btcChange > 0 ? "bullish" : nasChange < 0 && btcChange < 0 ? "bearish" : "neutral",
    },
  ];

  const sentimentIcon = (s: IntelRow["sentiment"]) => {
    if (s === "bullish") return <TrendingUp className="h-3 w-3 text-green-400" />;
    if (s === "bearish") return <TrendingDown className="h-3 w-3 text-red-400" />;
    return <Minus className="h-3 w-3 text-white/30" />;
  };

  const sentimentColor = (s: IntelRow["sentiment"]) => {
    if (s === "bullish") return "text-green-400";
    if (s === "bearish") return "text-red-400";
    return "text-white/40";
  };

  return (
    <div className="rounded-xl border border-white/[0.08] p-4" style={{ backgroundColor: "#111827" }}>
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Market Intelligence</h2>

      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs text-white/45">{row.label}</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono font-semibold ${sentimentColor(row.sentiment)}`}>
                {row.value}
              </span>
              {sentimentIcon(row.sentiment)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.05]">
        <p className="text-[10px] text-white/20 text-center">Live · auto-refreshing</p>
      </div>
    </div>
  );
}
