import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListFinances,
  useGetFinanceSummary,
  useCreateFinance,
  getListFinancesQueryKey,
  getGetFinanceSummaryQueryKey
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const financeSchema = z.object({
  type: z.string().min(1, "Type is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  month: z.string().min(1, "Month is required"),
});

export default function FinanceTracker() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  const queryClient = useQueryClient();

  const { data: summary, isLoading: isLoadingSummary } = useGetFinanceSummary();
  const { data: records, isLoading: isLoadingRecords } = useListFinances({ month: filterMonth });
  const createFinance = useCreateFinance();

  const form = useForm<z.infer<typeof financeSchema>>({
    resolver: zodResolver(financeSchema),
    defaultValues: {
      type: "income",
      category: "Trading",
      amount: 0,
      description: "",
      month: format(new Date(), "yyyy-MM"),
    },
  });

  const onSubmit = (data: z.infer<typeof financeSchema>) => {
    createFinance.mutate({ data }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListFinancesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
      }
    });
  };

  // Format data for Recharts
  const chartData = summary?.byCategory
    ? summary.byCategory
        .filter(c => c.type === "income")
        .map(c => ({ name: c.category, value: c.total }))
    : [];

  const CATEGORY_COLORS: Record<string, string> = {
    "Trading": "hsl(var(--chart-1))",
    "Web Design": "hsl(var(--chart-2))",
    "Printing": "hsl(var(--chart-3))",
    "Other": "hsl(var(--chart-4))",
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finance Operations</h1>
            <p className="text-muted-foreground">Multi-stream income and expense tracking.</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>New Transaction</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Trading">Trading</SelectItem>
                          <SelectItem value="Web Design">Web Design</SelectItem>
                          <SelectItem value="Printing">Printing</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="month" render={({ field }) => (
                    <FormItem><FormLabel>Month</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Invoice #123, Prop firm fee..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createFinance.isPending}>
                  {createFinance.isPending ? "Logging..." : "Log Transaction"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Revenue
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-green-500">
              ${summary?.totalRevenue?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Expenses
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-destructive">
              ${summary?.totalExpenses?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Net Profit
              <DollarSign className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-mono ${summary?.netProfit && summary.netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              ${summary?.netProfit?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Transactions</CardTitle>
            <Input 
              type="month" 
              className="w-40 bg-background" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            {isLoadingRecords ? (
              <div className="space-y-4 pt-4">
                <div className="h-12 bg-muted/20 animate-pulse rounded" />
                <div className="h-12 bg-muted/20 animate-pulse rounded" />
                <div className="h-12 bg-muted/20 animate-pulse rounded" />
              </div>
            ) : !records?.length ? (
              <div className="py-12 text-center text-muted-foreground">No transactions for this month.</div>
            ) : (
              <div className="divide-y divide-border">
                {records.map(record => (
                  <div key={record.id} className="py-3 flex items-center justify-between hover:bg-white/5 px-2 rounded-md transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${record.type === 'income' ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                        {record.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{record.description}</p>
                        <p className="text-xs text-muted-foreground">{record.category} • {format(new Date(record.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className={`font-mono font-bold ${record.type === 'income' ? 'text-green-500' : 'text-destructive'}`}>
                      {record.type === 'income' ? '+' : '-'}${record.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232328" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#888', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#888', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(value) => `$${value/1000}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0f0f12', borderColor: '#232328', borderRadius: '8px' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "hsl(var(--primary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No income data available
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-3">
              {chartData.map(entry => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || "hsl(var(--primary))" }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                  </div>
                  <span className="font-mono font-medium">${entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
