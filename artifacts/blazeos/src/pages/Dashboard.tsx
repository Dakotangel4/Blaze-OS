import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Users, Calendar as CalendarIcon, DollarSign, Target, CheckCircle2, ArrowRight } from "lucide-react";
import { useGetDashboardSummary, useGetDailyBias, useUpdateDailyBias, getGetDailyBiasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { TodayEventsWidget } from "@/components/dashboard/TodayEventsWidget";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          System Online • {format(new Date(), "MMM d, yyyy")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className={`text-2xl font-bold ${summary?.totalPnl && summary.totalPnl >= 0 ? "text-green-500" : "text-destructive"}`}>
                ${summary?.totalPnl?.toFixed(2) || "0.00"}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {summary?.winRate ? (summary.winRate * 100).toFixed(1) : "0"}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{summary?.openClients || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{summary?.upcomingEvents || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 bg-card border-border shadow-md">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSummary ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : summary?.recentTrades && summary.recentTrades.length > 0 ? (
              <div className="divide-y divide-border">
                {summary.recentTrades.map((trade) => (
                  <div key={trade.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${trade.result === "Win" ? "bg-green-500" : "bg-destructive"}`} />
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {trade.symbol} 
                          <Badge variant="outline" className="text-xs uppercase">{trade.direction}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{format(new Date(trade.createdAt), "MMM d, HH:mm")} • {trade.setupType}</div>
                      </div>
                    </div>
                    <div className={`font-bold ${trade.pnl && trade.pnl >= 0 ? "text-green-500" : "text-destructive"}`}>
                      {trade.pnl && trade.pnl > 0 ? "+" : ""}${trade.pnl?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <TrendingUp className="h-12 w-12 mb-3 opacity-20" />
                <p>No recent trades logged.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-card border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Daily Bias
            </CardTitle>
            {!isEditingBias && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingBias(true)}>Edit</Button>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingBias ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : isEditingBias ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {["Bullish", "Bearish", "Neutral"].map((d) => (
                    <Button
                      key={d}
                      variant={biasDirection === d ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBiasDirection(d)}
                      className={
                        biasDirection === d
                          ? d === "Bullish" ? "bg-green-600 hover:bg-green-700" : d === "Bearish" ? "bg-destructive hover:bg-destructive/90" : ""
                          : ""
                      }
                    >
                      {d}
                    </Button>
                  ))}
                </div>
                <Textarea 
                  value={biasNotes}
                  onChange={(e) => setBiasNotes(e.target.value)}
                  placeholder="Market structure notes, key levels..."
                  className="min-h-[120px] bg-background font-mono text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setIsEditingBias(false)}>Cancel</Button>
                  <Button onClick={handleSaveBias} disabled={updateBias.isPending}>
                    {updateBias.isPending ? "Saving..." : "Save Bias"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Current Stance:</span>
                  <Badge 
                    className={`text-sm px-3 py-1 ${
                      bias?.direction === "Bullish" ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : 
                      bias?.direction === "Bearish" ? "bg-destructive/20 text-destructive hover:bg-destructive/30" : 
                      "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {bias?.direction || "Neutral"}
                  </Badge>
                </div>
                {bias?.notes ? (
                  <div className="p-4 bg-background rounded-md border border-border">
                    <p className="whitespace-pre-wrap text-sm font-mono text-muted-foreground">{bias.notes}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No notes for today.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TodayEventsWidget />
    </div>
  );
}
