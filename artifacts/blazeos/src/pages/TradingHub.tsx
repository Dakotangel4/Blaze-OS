import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowDownUp, Camera } from "lucide-react";
import { TradeReviewModal } from "@/components/trading/TradeReviewModal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { safeFormat } from "@/lib/safeDate";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTrades,
  useGetTradeStats,
  useCreateTrade,
  getListTradesQueryKey,
  getGetTradeStatsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";

import PriceTicker from "@/components/PriceTicker";
import { SessionBar } from "@/components/trading/SessionBar";
import { BiasPanel } from "@/components/trading/BiasPanel";
import { ActiveTradesWidget } from "@/components/trading/ActiveTradesWidget";
import { RiskWidget } from "@/components/trading/RiskWidget";
import { QuickActions } from "@/components/trading/QuickActions";
import { CalendarWidget } from "@/components/trading/CalendarWidget";
import { MarketIntel } from "@/components/trading/MarketIntel";

const tradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  direction: z.string().min(1, "Direction is required"),
  entryPrice: z.coerce.number().min(0, "Entry price must be positive"),
  exitPrice: z.coerce.number().min(0, "Exit price must be positive"),
  riskPercent: z.coerce.number().min(0.1, "Risk % must be positive"),
  lotSize: z.coerce.number().min(0.01, "Lot size must be positive"),
  setupType: z.string().min(1, "Setup type is required"),
  session: z.string().min(1, "Session is required"),
  result: z.string().min(1, "Result is required"),
  pnl: z.coerce.number(),
  notes: z.string().optional(),
});

export default function TradingHub() {
  const [filterSymbol, setFilterSymbol] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewTrade, setReviewTrade] = useState<{
    id: number; symbol: string; direction: string; entryPrice: number;
    exitPrice: number; riskPercent: number; lotSize: number; setupType: string;
    session: string; result: string; notes?: string | null; pnl?: number | null; createdAt: string;
  } | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const queryClient = useQueryClient();

  const queryParams = {
    ...(filterSymbol !== "all" ? { symbol: filterSymbol } : {}),
    ...(filterResult !== "all" ? { result: filterResult } : {}),
  };

  const { data: trades, isLoading: isLoadingTrades } = useListTrades(queryParams);
  const { data: stats } = useGetTradeStats();
  const createTrade = useCreateTrade();

  const form = useForm<z.infer<typeof tradeSchema>>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      symbol: "XAUUSD",
      direction: "Buy",
      entryPrice: 0,
      exitPrice: 0,
      riskPercent: 1.0,
      lotSize: 0.1,
      setupType: "Breakout",
      session: "New York",
      result: "Win",
      pnl: 0,
      notes: "",
    },
  });

  const onSubmit = (data: z.infer<typeof tradeSchema>) => {
    createTrade.mutate({ data }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTradeStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-0 -mx-4 md:-mx-8 -mt-4 md:-mt-8">
      {/* Live Price Ticker */}
      <PriceTicker />

      {/* Session Info Bar */}
      <SessionBar />

      {/* Main Dashboard Grid */}
      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-12 gap-4">

          {/* ── LEFT / MAIN COLUMN (col 1-8) ── */}
          <div className="col-span-12 lg:col-span-8 space-y-4">

            {/* Bias Panel */}
            <BiasPanel />

            {/* Active Trades + Risk side-by-side */}
            <div className="grid grid-cols-2 gap-4">
              <ActiveTradesWidget />
              <RiskWidget />
            </div>

            {/* Quick Actions */}
            <QuickActions onNewTrade={() => setIsDialogOpen(true)} />

            {/* Calendar Widget */}
            <CalendarWidget />
          </div>

          {/* ── RIGHT COLUMN (col 9-12) ── */}
          <div className="col-span-12 lg:col-span-4 space-y-4">

            {/* Market Intelligence (live from ticker hook) */}
            <MarketIntel />

            {/* Performance Snapshot */}
            <div className="rounded-xl border border-white/[0.08] p-4" style={{ backgroundColor: "#111827" }}>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Performance</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Total P&amp;L</span>
                  <span className={`font-mono font-bold ${(stats?.totalPnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {(stats?.totalPnl ?? 0) >= 0 ? "+" : ""}${(stats?.totalPnl ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Win Rate</span>
                  <span className="font-mono text-white/70">{stats?.winRate ? (stats.winRate * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Total Trades</span>
                  <span className="font-mono text-white/70">{stats?.totalTrades ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">W / L</span>
                  <span className="font-mono text-white/70">{stats?.wins ?? 0} / {stats?.losses ?? 0}</span>
                </div>
                {stats?.bestTrade != null && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Best Trade</span>
                    <span className="font-mono text-green-400">+${stats.bestTrade.toFixed(2)}</span>
                  </div>
                )}
                {stats?.worstTrade != null && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Worst Trade</span>
                    <span className="font-mono text-red-400">${stats.worstTrade.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Full-Width Trade History ── */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowDownUp className="h-4 w-4" />
              Trade History
            </CardTitle>
            <div className="flex gap-2">
              <Select value={filterSymbol} onValueChange={setFilterSymbol}>
                <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue placeholder="Symbol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Symbols</SelectItem>
                  <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                  <SelectItem value="NAS100">NAS100</SelectItem>
                  <SelectItem value="BTCUSD">BTCUSD</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterResult} onValueChange={setFilterResult}>
                <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue placeholder="Result" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="Win">Win</SelectItem>
                  <SelectItem value="Loss">Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTrades ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !trades?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No trades found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Dir</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Setup</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">P&amp;L</TableHead>
                    <TableHead className="text-center w-16">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {safeFormat(trade.createdAt, "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="font-bold text-sm">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={trade.direction === "Buy" ? "text-green-500 border-green-500/30" : "text-destructive border-destructive/30"}>
                          {trade.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{trade.lotSize}</TableCell>
                      <TableCell className="text-sm">{trade.setupType}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{trade.session}</TableCell>
                      <TableCell>
                        <Badge className={
                          trade.result === "Win" ? "bg-green-500/15 text-green-500 border-green-500/20" :
                          trade.result === "Loss" ? "bg-destructive/15 text-destructive border-destructive/20" :
                          "bg-secondary text-secondary-foreground"
                        }>
                          {trade.result}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-bold font-mono ${trade.pnl && trade.pnl >= 0 ? "text-green-500" : "text-destructive"}`}>
                        {trade.pnl && trade.pnl > 0 ? "+" : ""}${trade.pnl?.toFixed(2) ?? "0.00"}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => {
                            setReviewTrade(trade as typeof reviewTrade);
                            setIsReviewOpen(true);
                          }}
                          title="View / upload screenshots"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trade Review / Screenshot Modal */}
      <TradeReviewModal
        trade={reviewTrade}
        open={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />

      {/* Log Trade Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Log New Trade</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="symbol" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                        <SelectItem value="NAS100">NAS100</SelectItem>
                        <SelectItem value="BTCUSD">BTCUSD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="direction" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Buy">Buy</SelectItem>
                        <SelectItem value="Sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="entryPrice" render={({ field }) => (
                  <FormItem><FormLabel>Entry Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="exitPrice" render={({ field }) => (
                  <FormItem><FormLabel>Exit Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lotSize" render={({ field }) => (
                  <FormItem><FormLabel>Lot Size</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="riskPercent" render={({ field }) => (
                  <FormItem><FormLabel>Risk (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="setupType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setup Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="SMC">SMC</SelectItem>
                        <SelectItem value="ICT">ICT</SelectItem>
                        <SelectItem value="Breakout">Breakout</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="session" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="London">London</SelectItem>
                        <SelectItem value="New York">New York</SelectItem>
                        <SelectItem value="Asian">Asian</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="result" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Win">Win</SelectItem>
                        <SelectItem value="Loss">Loss</SelectItem>
                        <SelectItem value="Break Even">Break Even</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="pnl" render={({ field }) => (
                  <FormItem><FormLabel>P&amp;L ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={createTrade.isPending}>
                {createTrade.isPending ? "Logging..." : "Log Trade"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
