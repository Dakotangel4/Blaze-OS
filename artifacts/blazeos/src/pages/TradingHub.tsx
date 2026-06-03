import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TrendingUp, Plus, BarChart3, Target, Crosshair, ArrowDownUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListTrades, 
  useGetTradeStats, 
  useCreateTrade, 
  getListTradesQueryKey,
  getGetTradeStatsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";

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

  const queryClient = useQueryClient();

  const queryParams = {
    ...(filterSymbol !== "all" ? { symbol: filterSymbol } : {}),
    ...(filterResult !== "all" ? { result: filterResult } : {}),
  };

  const { data: trades, isLoading: isLoadingTrades } = useListTrades(queryParams);
  const { data: stats, isLoading: isLoadingStats } = useGetTradeStats();
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
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trading Hub</h1>
            <p className="text-muted-foreground">Institutional trade journaling and analytics.</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Log New Trade</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select symbol" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                            <SelectItem value="NAS100">NAS100</SelectItem>
                            <SelectItem value="BTCUSD">BTCUSD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direction</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select direction" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Buy">Buy</SelectItem>
                            <SelectItem value="Sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <FormField
                    control={form.control}
                    name="setupType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select setup" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SMC">SMC</SelectItem>
                            <SelectItem value="ICT">ICT</SelectItem>
                            <SelectItem value="Breakout">Breakout</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="session"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="London">London</SelectItem>
                            <SelectItem value="New York">New York</SelectItem>
                            <SelectItem value="Asian">Asian</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="result"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Result</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Win">Win</SelectItem>
                            <SelectItem value="Loss">Loss</SelectItem>
                            <SelectItem value="Break Even">Break Even</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="pnl" render={({ field }) => (
                    <FormItem><FormLabel>P&L ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
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

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-24" /> : (
              <div className={`text-2xl font-bold ${stats?.totalPnl && stats.totalPnl >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                ${stats?.totalPnl?.toFixed(2) || '0.00'}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" /> Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">
                {stats?.winRate ? (stats.winRate * 100).toFixed(1) : '0'}%
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4" /> Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">
                {stats?.totalTrades || 0} <span className="text-sm font-normal text-muted-foreground ml-2">({stats?.wins || 0}W / {stats?.losses || 0}L)</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Crosshair className="h-4 w-4" /> Best Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-xl font-bold">
                {stats?.bySetup && stats.bySetup.length > 0 
                  ? stats.bySetup.reduce((prev, current) => (prev.winRate > current.winRate) ? prev : current).setupType 
                  : "N/A"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Trade History</CardTitle>
          <div className="flex gap-2">
            <Select value={filterSymbol} onValueChange={setFilterSymbol}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Symbol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Symbols</SelectItem>
                <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                <SelectItem value="NAS100">NAS100</SelectItem>
                <SelectItem value="BTCUSD">BTCUSD</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterResult} onValueChange={setFilterResult}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Result" /></SelectTrigger>
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
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !trades?.length ? (
            <div className="text-center py-8 text-muted-foreground">No trades found matching criteria.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Dir</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Setup</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-mono text-sm">{format(new Date(trade.createdAt), "MMM d, HH:mm")}</TableCell>
                    <TableCell className="font-bold">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={trade.direction === "Buy" ? "text-green-500" : "text-destructive"}>
                        {trade.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.lotSize}</TableCell>
                    <TableCell>{trade.setupType}</TableCell>
                    <TableCell>
                      <Badge className={trade.result === "Win" ? "bg-green-500/20 text-green-500" : trade.result === "Loss" ? "bg-destructive/20 text-destructive" : "bg-secondary text-secondary-foreground"}>
                        {trade.result}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${trade.pnl && trade.pnl >= 0 ? "text-green-500" : "text-destructive"}`}>
                      {trade.pnl && trade.pnl > 0 ? "+" : ""}${trade.pnl?.toFixed(2) || "0.00"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
