import { useGetTradeStats } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface EquityPoint { date: string; cumPnlR: number }
interface SessionPerf { session: string; winRate: number; trades: number }
interface PairPerf { pair: string; pnlR: number; trades: number }

export default function PerformanceDNA() {
  const { data: stats } = useGetTradeStats();
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [sessions, setSessions] = useState<SessionPerf[]>([]);
  const [pairs, setPairs] = useState<PairPerf[]>([]);

  useEffect(() => {
    fetch("/api/trades/equity-curve?days=90").then(r => r.json()).then(setEquity).catch(() => {});
    fetch("/api/trades/session-performance").then(r => r.json()).then(setSessions).catch(() => {});
    fetch("/api/trades/pair-performance").then(r => r.json()).then(setPairs).catch(() => {});
  }, []);

  const drawdownData = equity.map((pt, i, arr) => {
    const maxSoFar = Math.max(...arr.slice(0, i + 1).map((p) => p.cumPnlR));
    return { ...pt, drawdown: pt.cumPnlR - maxSoFar };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Performance DNA</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Deep analysis of your trading patterns</p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, pos: stats.winRate >= 50 },
            { label: "Avg R:R", value: `1:${stats.avgRisk.toFixed(2)}`, pos: stats.avgRisk >= 2 },
            { label: "Total P&L", value: `$${stats.totalPnl.toFixed(0)}`, pos: stats.totalPnl >= 0 },
            { label: "Total Trades", value: `${stats.totalTrades}`, pos: true },
          ].map((s) => (
            <Card key={s.label} className="border-border/40">
              <CardContent className="p-3 md:p-4">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
                <div className={cn("text-2xl font-bold font-mono", s.pos ? "text-green-400" : "text-red-400")}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      )}

      {stats && (stats.bestTrade != null || stats.worstTrade != null) && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Best Trade", value: stats.bestTrade != null ? `$${stats.bestTrade.toFixed(0)}` : "—", pos: true },
            { label: "Worst Trade", value: stats.worstTrade != null ? `$${stats.worstTrade.toFixed(0)}` : "—", pos: false },
          ].map((s) => (
            <Card key={s.label} className="border-border/40">
              <CardContent className="p-3 md:p-4">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
                <div className={cn("text-base font-bold font-mono truncate", s.pos ? "text-green-400" : "text-red-400")}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-border/40">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cumulative P&L ($)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {equity.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={equity} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6200" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff6200" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }} tickLine={false} axisLine={false} />
                  <ReferenceLine y={0} stroke="hsl(0 0% 30%)" strokeDasharray="3 3" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 6%)", border: "1px solid hsl(0 0% 12%)", borderRadius: "6px", fontSize: 11 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Cum P&L"]} />
                  <Area type="monotone" dataKey="cumPnlR" stroke="#ff6200" strokeWidth={2} fill="url(#perfGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Drawdown Curve</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {drawdownData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={drawdownData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 6%)", border: "1px solid hsl(0 0% 12%)", borderRadius: "6px", fontSize: 11 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Drawdown"]} />
                  <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fill="url(#ddGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Win Rate by Session</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {sessions.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={sessions} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" />
                  <XAxis dataKey="session" tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <ReferenceLine y={50} stroke="hsl(0 0% 30%)" strokeDasharray="3 3" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 6%)", border: "1px solid hsl(0 0% 12%)", borderRadius: "6px", fontSize: 11 }} />
                  <Bar dataKey="winRate" radius={[2, 2, 0, 0]}>
                    {sessions.map((entry, index) => <Cell key={index} fill={entry.winRate >= 50 ? "#22c55e" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">P&L by Symbol ($)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {pairs.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={pairs.slice(0, 6)} layout="vertical" margin={{ top: 4, right: 12, left: 24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 12%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(0 0% 55%)" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="pair" tick={{ fontSize: 9, fill: "hsl(0 0% 65%)", fontFamily: "monospace" }} tickLine={false} axisLine={false} width={52} />
                  <ReferenceLine x={0} stroke="hsl(0 0% 30%)" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 6%)", border: "1px solid hsl(0 0% 12%)", borderRadius: "6px", fontSize: 11 }} />
                  <Bar dataKey="pnlR" radius={[0, 2, 2, 0]}>
                    {pairs.slice(0, 6).map((entry, index) => <Cell key={index} fill={entry.pnlR >= 0 ? "#22c55e" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
