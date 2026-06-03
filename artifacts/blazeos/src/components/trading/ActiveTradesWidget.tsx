import { useListTrades } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

export function ActiveTradesWidget() {
  const { data: trades, isLoading } = useListTrades({});

  const recent: any[] = trades?.slice(0, 4) ?? [];

  return (
    <div className="rounded-xl border border-white/[0.08] p-4 h-full" style={{ backgroundColor: "#111827" }}>
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Recent Trades</h2>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-white/5" />)}
        </div>
      ) : recent.length === 0 ? (
        <p className="text-xs text-white/25 py-4 text-center">No trades logged yet.</p>
      ) : (
        <div className="space-y-2">
          {recent.map((t) => {
            const isWin = t.result === "Win";
            const isBuy = t.direction === "Buy";
            return (
              <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/20">
                <div className="flex items-center gap-2">
                  {isBuy
                    ? <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                    : <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                  }
                  <div>
                    <p className="text-xs font-bold text-white/80">{t.symbol}</p>
                    <p className="text-[10px] text-white/35">{t.setupType} · {t.session}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold font-mono ${isWin ? "text-green-400" : t.result === "Loss" ? "text-red-400" : "text-white/50"}`}>
                    {(t.pnl ?? 0) > 0 ? "+" : ""}${(t.pnl ?? 0).toFixed(2)}
                  </p>
                  <Badge
                    className={`text-[9px] h-4 px-1.5 ${isWin ? "bg-green-500/15 text-green-400 border-green-500/20" : t.result === "Loss" ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-white/10 text-white/40 border-white/10"}`}
                  >
                    {t.result}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
