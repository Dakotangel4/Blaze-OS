import { useGetTradeStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export function RiskWidget() {
  const { data: stats, isLoading } = useGetTradeStats();

  const maxRisk = 2;
  const avgRisk = stats?.avgRisk ?? 0;
  const usedPct = Math.min((avgRisk / maxRisk) * 100, 100);
  const isSafe = avgRisk <= 1;
  const isWarning = avgRisk > 1 && avgRisk <= 1.5;

  const statusColor = isSafe ? "text-green-400" : isWarning ? "text-yellow-400" : "text-red-400";
  const statusLabel = isSafe ? "SAFE" : isWarning ? "CAUTION" : "HIGH RISK";
  const barColor = isSafe ? "bg-green-500" : isWarning ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="rounded-xl border border-white/[0.08] p-4 h-full" style={{ backgroundColor: "#111827" }}>
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Risk Snapshot</h2>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-full bg-white/5" />)}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/20 rounded-lg p-2.5">
              <p className="text-white/35 text-[10px] mb-0.5">Avg Risk/Trade</p>
              <p className="font-bold text-white/80">{avgRisk.toFixed(2)}%</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5">
              <p className="text-white/35 text-[10px] mb-0.5">Max Drawdown</p>
              <p className="font-bold text-white/80">{maxRisk}%</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5">
              <p className="text-white/35 text-[10px] mb-0.5">Total Trades</p>
              <p className="font-bold text-white/80">{stats?.totalTrades ?? 0}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5">
              <p className="text-white/35 text-[10px] mb-0.5">Win Rate</p>
              <p className="font-bold text-white/80">{stats?.winRate ? (stats.winRate * 100).toFixed(0) : 0}%</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-white/30 mb-1">
              <span>Risk exposure</span>
              <span>{usedPct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>

          <div className={`flex items-center gap-1.5 text-xs font-bold ${statusColor}`}>
            {isSafe
              ? <ShieldCheck className="h-3.5 w-3.5" />
              : <ShieldAlert className="h-3.5 w-3.5" />
            }
            Status: {statusLabel}
          </div>
        </div>
      )}
    </div>
  );
}
