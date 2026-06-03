import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar as CalendarIcon, Plus, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { safeFormatDate } from "@/utils/dateSafe";
import { 
  useListCalendarEvents, 
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  getListCalendarEventsQueryKey 
} from "@workspace/api-client-react";
import type { CalendarEvent } from "@workspace/api-client-react";

const eventSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  currency: z.string().min(1, "Currency is required"),
  impact: z.string().min(1, "Impact is required"),
  eventTime: z.string().min(1, "Event time is required"), // YYYY-MM-DDTHH:mm
  forecast: z.string().optional(),
  previous: z.string().optional(),
});

const actualSchema = z.object({
  actual: z.string().min(1, "Actual value is required"),
});

export default function EconomicCalendar() {
  const [filterImpact, setFilterImpact] = useState<string>("all");
  const [filterCurrency, setFilterCurrency] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const queryParams = {
    ...(filterImpact !== "all" ? { impact: filterImpact } : {}),
    ...(filterCurrency !== "all" ? { currency: filterCurrency } : {}),
  };

  const { data: rawEvents, isLoading } = useListCalendarEvents(queryParams);

  const events = rawEvents?.filter(
    (e) => e.eventTime && !isNaN(new Date(e.eventTime).getTime())
  );
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      eventName: "",
      currency: "USD",
      impact: "High",
      eventTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      forecast: "",
      previous: "",
    },
  });

  const actualForm = useForm<z.infer<typeof actualSchema>>({
    resolver: zodResolver(actualSchema),
    defaultValues: { actual: "" }
  });

  const onSubmit = (data: z.infer<typeof eventSchema>) => {
    // Add seconds and timezone info if needed by API, or API accepts ISO string.
    createEvent.mutate({ data: { ...data, eventTime: new Date(data.eventTime).toISOString() } }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListCalendarEventsQueryKey() });
      }
    });
  };

  const onActualSubmit = (eventId: number, data: z.infer<typeof actualSchema>) => {
    updateEvent.mutate({ id: eventId, data: { actual: data.actual } }, {
      onSuccess: () => {
        setEditingEvent(null);
        actualForm.reset();
        queryClient.invalidateQueries({ queryKey: getListCalendarEventsQueryKey() });
      }
    });
  };

  const getImpactBadge = (impact: string) => {
    switch(impact) {
      case "High": return <Badge className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">High</Badge>;
      case "Medium": return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/30">Med</Badge>;
      default: return <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted/80">Low</Badge>;
    }
  };

  // Very simple deviation logic just for visual flair if both numbers are parseable
  const getDeviationIcon = (actual?: string | null, forecast?: string | null) => {
    if (!actual || !forecast) return <Minus className="h-3 w-3 text-muted-foreground" />;
    const a = parseFloat(actual.replace(/[^0-9.-]/g, ''));
    const f = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
    if (isNaN(a) || isNaN(f)) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (a > f) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (a < f) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Economic Calendar</h1>
            <p className="text-muted-foreground">Track macro events and input actual data post-release.</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Track Macro Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="eventName" render={({ field }) => (
                  <FormItem><FormLabel>Event Name</FormLabel><FormControl><Input placeholder="e.g. CPI m/m" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="JPY">JPY</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="impact" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impact</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Impact" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="eventTime" render={({ field }) => (
                  <FormItem><FormLabel>Date & Time (Local)</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="forecast" render={({ field }) => (
                    <FormItem><FormLabel>Forecast</FormLabel><FormControl><Input placeholder="0.2%" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="previous" render={({ field }) => (
                    <FormItem><FormLabel>Previous</FormLabel><FormControl><Input placeholder="0.3%" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={createEvent.isPending}>
                  {createEvent.isPending ? "Adding..." : "Add Event"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
          <CardTitle className="text-lg">Upcoming Releases</CardTitle>
          <div className="flex gap-2">
            <Select value={filterCurrency} onValueChange={setFilterCurrency}>
              <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="Cur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cur</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterImpact} onValueChange={setFilterImpact}>
              <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="Impact" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Impact</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-background">
              <TableRow>
                <TableHead className="w-[140px]">Time</TableHead>
                <TableHead className="w-[80px]">Cur.</TableHead>
                <TableHead className="w-[80px]">Impact</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Forecast</TableHead>
                <TableHead className="text-right">Previous</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading events...</TableCell></TableRow>
              ) : events && events.length > 0 ? (
                events.map((event) => (
                  <TableRow key={event.id} className="hover:bg-white/5 transition-colors group">
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{safeFormatDate(event.eventTime, "HH:mm")}</span>
                        <span className="text-xs text-muted-foreground">{safeFormatDate(event.eventTime, "MMM d", "No date")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{event.currency}</TableCell>
                    <TableCell>{getImpactBadge(event.impact)}</TableCell>
                    <TableCell className="font-medium">{event.eventName}</TableCell>
                    
                    <TableCell className="text-right">
                      {event.actual ? (
                        <div className="flex items-center justify-end gap-2 font-mono font-bold text-foreground">
                          {event.actual}
                          {getDeviationIcon(event.actual, event.forecast)}
                        </div>
                      ) : editingEvent === event.id ? (
                        <Form {...actualForm}>
                          <form onSubmit={actualForm.handleSubmit((data) => onActualSubmit(event.id, data))} className="flex justify-end gap-2">
                            <FormField control={actualForm.control} name="actual" render={({ field }) => (
                              <Input className="h-7 w-20 px-2 py-0 text-xs font-mono text-right" placeholder="Value" autoFocus {...field} />
                            )} />
                            <Button type="submit" size="sm" className="h-7 px-2 text-xs" disabled={updateEvent.isPending}>Save</Button>
                            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditingEvent(null)}>X</Button>
                          </form>
                        </Form>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                          onClick={() => {
                            setEditingEvent(event.id);
                            actualForm.setValue("actual", "");
                          }}
                        >
                          Input Actual
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{event.forecast || "-"}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{event.previous || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No events scheduled.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
