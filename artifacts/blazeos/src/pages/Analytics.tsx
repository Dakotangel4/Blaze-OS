import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, TrendingUp, TrendingDown, Target, Activity,
  Award, AlertTriangle, Clock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { useGetTradeStats, useListTrades } from "@workspace/api-client-react";
import { format, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

function StatCard({
  label, value, sub, icon: Icon, color, isLoading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="bg-[#0d0d14] border-white/[0.06]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        {isLoading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <>
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
            {sub && <p className="text-[10px] text-white/25 mt-1 font-mono">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const COLORS = {
  win: "#22c55e",
  loss: "#ef4444",
  be: "#64748b",
  chart: "hsl(var(--primary))",
};

export default function Analytics() {
  const { data: stats, isLoading: isLoadingStats } = useGetTradeStats();
  const { data: trades, isLoading: isLoadingTrades } = useListTrades({});

  const winRate = stats?.winRate ? (stats.winRate * 100).toFixed(1) : "0.0";
  const profitFactor =
    stats && stats.losses && stats.losses > 0
      ? ((stats.wins ?? 0) / stats.losses).toFixed(2)
      : "∞";

  const sessionData = trades
    ? Object.entries(
        trades.reduce(
          (acc, t) => {
            const s = t.session || "Unknown";
            if (!acc[s]) acc[s] = { wins: 0, losses: 0, pnl: 0 };
            if (t.result === "Win") acc[s].wins++;
            else if (t.result === "Loss") acc[s].losses++;
            acc[s].pnl += t.pnl ?? 0;
            return acc;
          },
          {} as Record<string, { wins: number; losses: number; pnl: number }>
        )
      ).map(([name, v]) => ({ name, ...v }))
    : [];

  const symbolData = trades
    ? Object.entries(
        trades.reduce(
          (acc, t) => {
            const s = t.symbol;
            if (!acc[s]) acc[s] = { wins: 0, total: 0, pnl: 0 };
            if (t.result === "Win") acc[s].wins++;
            acc[s].total++;
            acc[s].pnl += t.pnl ?? 0;
            return acc;
          },
          {} as Record<string, { wins: number; total: number; pnl: number }>
        )
      ).map(([name, v]) => ({
        name,
        winRate: v.total ? ((v.wins / v.total) * 100).toFixed(0) : "0",
        pnl: v.pnl,
        total: v.total,
      }))
    : [];

  const now = new Date();
  const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
  const monthlyData = months.map((m) => {
    const label = format(m, "MMM");
    const monthTrades = (trades ?? []).filter((t) => {
      const d = new Date(t.createdAt);
      return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    });
    const pnl = monthTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const wins = monthTrades.filter((t) => t.result === "Win").length;
    return { month: label, pnl, trades: monthTrades.length, wins };
  });

  const equityCurve = (() => {
    if (!trades) return [];
    const sorted = [...trades].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let equity = 0;
    return sorted.map((t, i) => {
      equity += t.pnl ?? 0;
      return { index: i + 1, equity: parseFloat(equity.toFixed(2)) };
    });
  })();

  const resultDist = [
    { name: "Win", value: stats?.wins ?? 0, color: COLORS.win },
    { name: "Loss", value: stats?.losses ?? 0, color: COLORS.loss },
    {
      name: "B/E",
      value: (stats?.totalTrades ?? 0) - (stats?.wins ?? 0) - (stats?.losses ?? 0),
      color: COLORS.be,
    },
  ].filter((d) => d.value > 0);

  const bestSession = sessionData.length
    ? sessionData.reduce((best, s) => (s.pnl > best.pnl ? s : best), sessionData[0])
    : null;

  const worstSession = sessionData.length
    ? sessionData.reduce((worst, s) => (s.pnl < worst.pnl ? s : worst), sessionData[0])
    : null;

  const avgRR =
    stats && stats.wins && stats.losses && stats.losses > 0
      ? (((stats.bestTrade ?? 0) / Math.abs(stats.worstTrade ?? 1)) * 0.5).toFixed(2)
      : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-xs text-white/30 font-mono mt-0.5">Trading performance overview</p>
          </div>
        </div>
        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 font-mono">
          {stats?.totalTrades ?? 0} total trades
        </Badge>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Target} color="text-green-400" isLoading={isLoadingStats} sub={`${stats?.wins ?? 0}W / ${stats?.losses ?? 0}L`} />
        <StatCard label="Total P&L" value={`$${(stats?.totalPnl ?? 0).toFixed(2)}`} icon={TrendingUp} color={(stats?.totalPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"} isLoading={isLoadingStats} />
        <StatCard label="Profit Factor" value={profitFactor} icon={Award} color="text-blue-400" isLoading={isLoadingStats} sub="wins / losses ratio" />
        <StatCard label="Avg R:R" value={avgRR} icon={Activity} color="text-yellow-400" isLoading={isLoadingStats} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Best Trade" value={stats?.bestTrade != null ? `+$${stats.bestTrade.toFixed(2)}` : "—"} icon={TrendingUp} color="text-green-400" isLoading={isLoadingStats} />
        <StatCard label="Worst Trade" value={stats?.worstTrade != null ? `$${stats.worstTrade.toFixed(2)}` : "—"} icon={TrendingDown} color="text-red-400" isLoading={isLoadingStats} />
        <StatCard label="Best Session" value={bestSession?.name ?? "—"} icon={Award} color="text-primary" isLoading={isLoadingStats} sub={bestSession ? `$${bestSession.pnl.toFixed(2)}` : undefined} />
        <StatCard label="Worst Session" value={worstSession?.name ?? "—"} icon={AlertTriangle} color="text-orange-400" isLoading={isLoadingStats} sub={worstSession ? `$${worstSession.pnl.toFixed(2)}` : undefined} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity curve */}
        <Card className="lg:col-span-2 bg-[#0d0d14] border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Equity Curve
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTrades ? (
              <Skeleton className="h-48 w-full" />
            ) : equityCurve.length < 2 ? (
              <div className="h-48 flex items-center justify-center text-white/20 text-sm font-mono">
                Log trades to see your equity curve
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={192}>
                <AreaChart data={equityCurve} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="index" tick={{ fill: "#ffffff25", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#ffffff25", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0d0d14", border: "1px solid #ffffff10", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Equity"]}
                    labelFormatter={(l) => `Trade #${l}`}
                  />
                  <Area type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#equityGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Win/Loss distribution */}
        <Card className="bg-[#0d0d14] border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-primary" />
              Win / Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-48 w-full" />
            ) : resultDist.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-white/20 text-sm font-mono">
                No trade data yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={resultDist} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                      {resultDist.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0d0d14", border: "1px solid #ffffff10", borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {resultDist.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                        <span className="text-white/40 font-mono">{d.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white/60">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly returns */}
        <Card className="bg-[#0d0d14] border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Monthly Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#ffffff25", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#ffffff25", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0d0d14", border: "1px solid #ffffff10", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "P&L"]}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? COLORS.win : COLORS.loss} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Session performance */}
        <Card className="bg-[#0d0d14] border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Session Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-white/20 text-sm font-mono">
                No session data yet
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {sessionData.map((s) => {
                  const total = s.wins + s.losses;
                  const wr = total ? ((s.wins / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={s.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60 font-semibold">{s.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-white/30 font-mono">{wr}% WR</span>
                          <span className={`font-mono font-bold ${s.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${s.pnl >= 0 ? "bg-green-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(100, Math.abs(s.pnl / 10))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Symbol breakdown */}
      {symbolData.length > 0 && (
        <Card className="bg-[#0d0d14] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Performance by Symbol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {symbolData.map((s) => (
                <div
                  key={s.name}
                  className="p-3 rounded-md bg-white/[0.02] border border-white/[0.04] hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold font-mono text-sm text-white/80">{s.name}</span>
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{s.total} trades</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/30">Win Rate</span>
                    <span className="font-mono text-green-400 font-bold">{s.winRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-white/30">P&L</span>
                    <span className={`font-mono font-bold ${s.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
