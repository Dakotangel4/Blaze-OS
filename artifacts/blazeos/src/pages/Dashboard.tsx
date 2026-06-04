import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Activity, TrendingUp, Target, DollarSign, Shield, Clock,
  NotebookPen, Calculator, Zap, Bot, ChevronRight, AlertTriangle,
} from "lucide-react";
import { useGetDashboardSummary, useGetDailyBias, useUpdateDailyBias, getGetDailyBiasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { TodayEventsWidget } from "@/components/dashboard/TodayEventsWidget";
import { Link } from "wouter";

const QUICK_ACTIONS = [
  { label: "New Trade", icon: TrendingUp, href: "/trading", color: "text-green-400 bg-green-400/10 hover:bg-green-400/20 border-green-400/20" },
  { label: "Journal Entry", icon: NotebookPen, href: "/journal", color: "text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 border-blue-400/20" },
  { label: "Risk Calc", icon: Calculator, href: "/risk", color: "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 border-yellow-400/20" },
  { label: "Execution", icon: Zap, href: "/execution", color: "text-primary bg-primary/10 hover:bg-primary/20 border-primary/20" },
  { label: "AI Center", icon: Bot, href: "/ai", color: "text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 border-purple-400/20" },
  { label: "Prop Firm", icon: Shield, href: "/prop-firm", color: "text-orange-400 bg-orange-400/10 hover:bg-orange-400/20 border-orange-400/20" },
];

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: bias, isLoading: isLoadingBias } = useGetDailyBias();
  const updateBias = useUpdateDailyBias();
  const queryClient = useQueryClient();

  const [isEditingBias, setIsEditingBias] = useState(false);
  const [biasNotes, setBiasNotes] = useState("");
  const [biasDirection, setBiasDirection] = useState("Neutral");
  const prevBiasId = useRef<number | null>(null);

  useEffect(() => {
    if (bias && prevBiasId.current !== bias.id) {
      setBiasNotes(bias.notes || "");
      setBiasDirection(bias.direction || "Neutral");
      prevBiasId.current = bias.id;
    }
  }, [bias]);

  const handleSaveBias = () => {
    updateBias.mutate(
      { data: { direction: biasDirection, notes: biasNotes } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetDailyBiasQueryKey(), data);
          setIsEditingBias(false);
        },
      }
    );
  };

  const winRatePct = summary?.winRate
    ? typeof summary.winRate === "number" && summary.winRate <= 1
      ? (summary.winRate * 100).toFixed(1)
      : Number(summary.winRate).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-xs text-white/30 font-mono mt-0.5">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-mono text-white/30 tracking-widest">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total P&L",
            value: isLoadingSummary ? null : `$${(summary?.totalPnl ?? 0).toFixed(2)}`,
            icon: DollarSign,
            color: (summary?.totalPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400",
            sub: "all-time",
          },
          {
            label: "Win Rate",
            value: isLoadingSummary ? null : `${winRatePct}%`,
            icon: Target,
            color: "text-primary",
            sub: `${summary?.totalTrades ?? 0} trades`,
          },
          {
            label: "Active Events",
            value: isLoadingSummary ? null : String(summary?.upcomingEvents ?? 0),
            icon: Clock,
            color: "text-yellow-400",
            sub: "economic calendar",
          },
          {
            label: "Knowledge",
            value: isLoadingSummary ? null : String(summary?.totalNotes ?? 0),
            icon: Activity,
            color: "text-blue-400",
            sub: "notes saved",
          },
        ].map((m) => (
          <Card key={m.label} className="bg-[#0d0d14] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">{m.label}</span>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              {m.value === null ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <>
                  <div className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</div>
                  <p className="text-[10px] text-white/20 mt-1 font-mono">{m.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Recent Trades + Events */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent trades */}
          <Card className="bg-[#0d0d14] border-white/[0.06]">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/[0.04]">
              <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Recent Trades
              </CardTitle>
              <Link href="/trading">
                <Button variant="ghost" size="sm" className="text-xs text-white/30 hover:text-white/70 h-7 gap-1">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingSummary ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : summary?.recentTrades && summary.recentTrades.length > 0 ? (
                <div className="divide-y divide-white/[0.04]">
                  {summary.recentTrades.map((trade) => (
                    <div key={trade.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-8 rounded-full ${trade.result === "Win" ? "bg-green-500" : trade.result === "Loss" ? "bg-red-500" : "bg-white/20"}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white/80 font-mono">{trade.symbol}</span>
                            <Badge variant="outline" className={`text-[10px] uppercase border ${trade.direction === "Buy" ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>
                              {trade.direction}
                            </Badge>
                            <span className="text-[10px] text-white/25 font-mono">{trade.setupType}</span>
                          </div>
                          <div className="text-[10px] text-white/25 font-mono mt-0.5">
                            {format(new Date(trade.createdAt), "MMM d, HH:mm")} · {trade.session}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold font-mono text-sm ${trade.pnl && trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {trade.pnl && trade.pnl > 0 ? "+" : ""}${trade.pnl?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 text-white/10" />
                  <p className="text-xs text-white/25 font-mono">No trades logged yet.</p>
                  <Link href="/trading">
                    <Button size="sm" variant="outline" className="mt-3 border-white/10 text-white/40 text-xs">
                      Log First Trade
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Economic calendar widget */}
          <TodayEventsWidget />
        </div>

        {/* Right: Bias + Quick Actions */}
        <div className="space-y-4">
          {/* Daily Bias */}
          <Card className="bg-[#0d0d14] border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/[0.04]">
              <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                Daily Bias
              </CardTitle>
              {!isEditingBias && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-white/30 hover:text-white/70" onClick={() => setIsEditingBias(true)}>
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {isLoadingBias ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : isEditingBias ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {["Bullish", "Bearish", "Neutral"].map((d) => (
                      <Button
                        key={d}
                        size="sm"
                        variant={biasDirection === d ? "default" : "outline"}
                        onClick={() => setBiasDirection(d)}
                        className={`text-xs ${
                          biasDirection === d
                            ? d === "Bullish" ? "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30"
                              : d === "Bearish" ? "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
                              : "bg-white/5 text-white/50 border-white/10"
                            : "border-white/10 text-white/30"
                        }`}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    value={biasNotes}
                    onChange={(e) => setBiasNotes(e.target.value)}
                    placeholder="Market structure, key levels, session narrative..."
                    className="min-h-[100px] bg-background border-white/[0.08] text-sm font-mono text-white/60 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsEditingBias(false)}>Cancel</Button>
                    <Button size="sm" className="text-xs" onClick={handleSaveBias} disabled={updateBias.isPending}>
                      {updateBias.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-xs px-3 py-1 ${
                        bias?.direction === "Bullish" ? "bg-green-500/15 text-green-400 border-green-500/30" :
                        bias?.direction === "Bearish" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                        "bg-white/5 text-white/40 border-white/10"
                      }`}
                    >
                      {bias?.direction || "Neutral"}
                    </Badge>
                    {bias?.updatedAt && (
                      <span className="text-[10px] text-white/20 font-mono">
                        {format(new Date(bias.updatedAt), "HH:mm")}
                      </span>
                    )}
                  </div>
                  {bias?.notes ? (
                    <div className="p-3 bg-background rounded-md border border-white/[0.06]">
                      <p className="whitespace-pre-wrap text-xs font-mono text-white/40 leading-relaxed">{bias.notes}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-white/20 font-mono">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-400/40" />
                      No bias notes for today.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-[#0d0d14] border-white/[0.06]">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-all text-xs font-medium ${action.color}`}>
                    <action.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{action.label}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
