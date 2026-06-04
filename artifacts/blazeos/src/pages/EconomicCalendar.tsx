import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon, Plus, AlertCircle, TrendingUp, TrendingDown,
  Minus, Pencil, Trash2, Loader2, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  useListCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  getListCalendarEventsQueryKey,
} from "@workspace/api-client-react";
import type { CalendarEvent } from "@workspace/api-client-react";
import {
  formatTimeGMT1,
  getDateKeyGMT1,
  formatDateLabelGMT1,
  isoToGMT1Input,
  gmt1InputToISO,
  getTodayKeyGMT1,
} from "@/utils/calendarUtils";

/* ─── Phase 2 structure ──────────────────────────────────────────────────
   To auto-populate events from an external API, implement a provider
   module at `artifacts/api-server/src/lib/calendarProviders.ts` that
   exports a `syncCalendarEvents(source: "finnhub" | "fmp" | "trading-economics")` function.
   Then add a POST /api/calendar/sync route that calls the provider,
   upserts events into calendarEventsTable by (event_time, currency, event_name),
   and returns a count of newly added events.
   The frontend can trigger sync via a "Sync" button or a scheduled cron job.
─────────────────────────────────────────────────────────────────────── */

/* ─── Constants ───────────────────────────────────────────────────────── */
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD"];
const IMPACTS    = ["High", "Medium", "Low"] as const;
type Impact = typeof IMPACTS[number];

const IMPACT_STYLES: Record<Impact, { dot: string; badge: string; row: string }> = {
  High:   { dot: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.7)]",    badge: "bg-red-500/10 text-red-400 border-red-500/20",    row: "hover:bg-red-500/[0.03]"    },
  Medium: { dot: "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20", row: "hover:bg-orange-500/[0.03]" },
  Low:    { dot: "bg-gray-500",                                          badge: "bg-gray-500/10 text-gray-400 border-gray-500/20",  row: "hover:bg-white/[0.02]"      },
};

/* ─── Impact chip ─────────────────────────────────────────────────────── */
function ImpactChip({ impact }: { impact: string }) {
  const s = IMPACT_STYLES[impact as Impact] ?? IMPACT_STYLES.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
      {impact}
    </span>
  );
}

/* ─── Deviation icon ──────────────────────────────────────────────────── */
function DeviationIcon({ actual, forecast }: { actual?: string | null; forecast?: string | null }) {
  if (!actual || !forecast) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  const a = parseFloat(actual.replace(/[^0-9.\-]/g, ""));
  const f = parseFloat(forecast.replace(/[^0-9.\-]/g, ""));
  if (isNaN(a) || isNaN(f)) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (a > f) return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (a < f) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

/* ─── Form schema ─────────────────────────────────────────────────────── */
const eventSchema = z.object({
  eventName: z.string().min(1, "Required"),
  currency:  z.string().min(1, "Required"),
  impact:    z.string().min(1, "Required"),
  eventTime: z.string().min(1, "Required"),
  forecast:  z.string().optional(),
  previous:  z.string().optional(),
  actual:    z.string().optional(),
});
type EventFormValues = z.infer<typeof eventSchema>;

const DEFAULT_FORM: EventFormValues = {
  eventName: "", currency: "USD", impact: "High",
  eventTime: isoToGMT1Input(new Date().toISOString()),
  forecast: "", previous: "", actual: "",
};

/* ─── Event form modal ────────────────────────────────────────────────── */
function EventFormModal({
  open, onOpenChange, title, defaultValues, onSubmit, isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  defaultValues: EventFormValues;
  onSubmit: (data: EventFormValues) => void;
  isPending: boolean;
}) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues,
    values: defaultValues,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="eventName" render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl><Input placeholder="e.g. CPI m/m, NFP, FOMC Rate Decision" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="impact" render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {IMPACTS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="eventTime" render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time <span className="text-muted-foreground font-normal">(GMT+1)</span></FormLabel>
                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="forecast" render={({ field }) => (
                <FormItem><FormLabel>Forecast</FormLabel><FormControl><Input placeholder="0.3%" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="previous" render={({ field }) => (
                <FormItem><FormLabel>Previous</FormLabel><FormControl><Input placeholder="0.2%" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="actual" render={({ field }) => (
                <FormItem><FormLabel>Actual</FormLabel><FormControl><Input placeholder="—" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {title.startsWith("Edit") ? "Save Changes" : "Add Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Delete confirm modal ────────────────────────────────────────────── */
function DeleteConfirmModal({
  event, onConfirm, onCancel, isPending,
}: {
  event: CalendarEvent | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={!!event} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Delete Event
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          Are you sure you want to delete <span className="font-semibold text-foreground">{event?.eventName}</span>? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Inline actual input ─────────────────────────────────────────────── */
function InlineActualInput({
  eventId, onSave, onCancel, isPending,
}: {
  eventId: number;
  onSave: (id: number, actual: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="flex items-center gap-1 justify-end"
      onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSave(eventId, value.trim()); }}
    >
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 w-20 px-2 text-xs font-mono text-right"
        placeholder="Value"
      />
      <Button type="submit" size="sm" className="h-7 px-2 text-xs" disabled={isPending || !value.trim()}>
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onCancel}>✕</Button>
    </form>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */
export default function EconomicCalendar() {
  const queryClient = useQueryClient();

  const [filterCurrency, setFilterCurrency] = useState("all");
  const [filterImpact,   setFilterImpact]   = useState("all");
  const [isAddOpen,      setIsAddOpen]      = useState(false);
  const [editEvent,      setEditEvent]      = useState<CalendarEvent | null>(null);
  const [deleteEvent,    setDeleteEvent]    = useState<CalendarEvent | null>(null);
  const [inlineActualId, setInlineActualId] = useState<number | null>(null);

  const { data: rawEvents, isLoading, isError, refetch } = useListCalendarEvents();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListCalendarEventsQueryKey() });
  }

  /* ── Client-side filter + group by date ── */
  const grouped = useMemo(() => {
    if (!rawEvents) return [];

    const filtered = rawEvents.filter((e: CalendarEvent) => {
      if (!e.eventTime || isNaN(new Date(e.eventTime).getTime())) return false;
      if (filterCurrency !== "all" && e.currency !== filterCurrency) return false;
      if (filterImpact   !== "all" && e.impact   !== filterImpact)   return false;
      return true;
    });

    filtered.sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());

    const groups: Record<string, { label: string; date: string; events: CalendarEvent[] }> = {};
    for (const ev of filtered) {
      const key = getDateKeyGMT1(ev.eventTime);
      if (!groups[key]) groups[key] = { label: formatDateLabelGMT1(ev.eventTime), date: key, events: [] };
      groups[key].events.push(ev);
    }

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }, [rawEvents, filterCurrency, filterImpact]);

  const totalFiltered = grouped.reduce((n, g) => n + g.events.length, 0);

  /* ── Handlers ── */
  function handleCreate(data: EventFormValues) {
    createEvent.mutate(
      { data: { ...data, eventTime: gmt1InputToISO(data.eventTime), forecast: data.forecast || undefined, previous: data.previous || undefined, actual: data.actual || undefined } },
      { onSuccess: () => { setIsAddOpen(false); invalidate(); } },
    );
  }

  function handleEdit(data: EventFormValues) {
    if (!editEvent) return;
    updateEvent.mutate(
      { id: editEvent.id, data: { ...data, eventTime: gmt1InputToISO(data.eventTime), forecast: data.forecast || undefined, previous: data.previous || undefined, actual: data.actual || undefined } },
      { onSuccess: () => { setEditEvent(null); invalidate(); } },
    );
  }

  function handleDelete() {
    if (!deleteEvent) return;
    deleteEventMutation.mutate({ id: deleteEvent.id }, {
      onSuccess: () => { setDeleteEvent(null); invalidate(); },
    });
  }

  function handleSaveActual(id: number, actual: string) {
    updateEvent.mutate(
      { id, data: { actual } },
      { onSuccess: () => { setInlineActualId(null); invalidate(); } },
    );
  }

  const editDefaults: EventFormValues = editEvent
    ? {
        eventName: editEvent.eventName,
        currency:  editEvent.currency,
        impact:    editEvent.impact,
        eventTime: isoToGMT1Input(editEvent.eventTime),
        forecast:  editEvent.forecast ?? "",
        previous:  editEvent.previous ?? "",
        actual:    editEvent.actual   ?? "",
      }
    : DEFAULT_FORM;

  /* ── Filter pill helpers ── */
  const currencyPills = ["all", ...CURRENCIES];
  const impactPills   = ["all", ...IMPACTS];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Economic Calendar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track macro events, log actuals, and never trade blind into high-impact news.
              <span className="ml-2 text-xs text-muted-foreground/60">Times in GMT+1</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium w-16 shrink-0">Currency</span>
          {currencyPills.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCurrency(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterCurrency === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium w-16 shrink-0">Impact</span>
          {impactPills.map((imp) => {
            const s = imp !== "all" ? IMPACT_STYLES[imp as Impact] : null;
            const active = filterImpact === imp;
            return (
              <button
                key={imp}
                onClick={() => setFilterImpact(imp)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  active && s
                    ? `${s.badge} border-current`
                    : active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {s && <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
                {imp === "all" ? "All Impact" : imp}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Results summary ── */}
      {!isLoading && !isError && (
        <p className="text-xs text-muted-foreground">
          {totalFiltered === 0 ? "No events match filters" : `${totalFiltered} event${totalFiltered !== 1 ? "s" : ""} found`}
          {(filterCurrency !== "all" || filterImpact !== "all") && (
            <button
              onClick={() => { setFilterCurrency("all"); setFilterImpact("all"); }}
              className="ml-2 text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {/* ── Content ── */}
      <Card className="bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
            <AlertCircle className="h-10 w-10 text-destructive/50" />
            <div>
              <p className="font-medium text-foreground">Failed to load events</p>
              <p className="text-sm text-muted-foreground mt-1">Check your connection and try again.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
            <div className="h-14 w-14 rounded-full bg-muted/30 flex items-center justify-center">
              <CalendarIcon className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No economic events available</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filterCurrency !== "all" || filterImpact !== "all"
                  ? "No events match the current filters."
                  : "Add your first event to start tracking the macro calendar."}
              </p>
            </div>
            <Button size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[100px_64px_90px_1fr_90px_80px_80px_72px] gap-2 px-4 py-2.5 border-b border-border bg-muted/20 text-xs font-medium text-muted-foreground sticky top-0">
              <div>Time (GMT+1)</div>
              <div>Cur.</div>
              <div>Impact</div>
              <div>Event</div>
              <div className="text-right">Actual</div>
              <div className="text-right">Forecast</div>
              <div className="text-right">Previous</div>
              <div />
            </div>

            {grouped.map((group) => {
              const isToday = group.date === getTodayKeyGMT1();
              return (
                <div key={group.date}>
                  {/* Day header */}
                  <div className={`px-4 py-2 text-xs font-semibold tracking-wide flex items-center gap-2 border-b border-border ${isToday ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted-foreground"}`}>
                    {isToday && <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                    {group.label.toUpperCase()}
                    {isToday && <Badge className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-primary/30">TODAY</Badge>}
                  </div>

                  {group.events.map((ev) => {
                    const s = IMPACT_STYLES[ev.impact as Impact] ?? IMPACT_STYLES.Low;
                    return (
                      <div
                        key={ev.id}
                        className={`grid grid-cols-[100px_64px_90px_1fr_90px_80px_80px_72px] gap-2 items-center px-4 py-3 border-b border-border/50 last:border-0 transition-colors group ${s.row}`}
                      >
                        {/* Time */}
                        <div className="font-mono text-sm font-semibold tabular-nums">
                          {formatTimeGMT1(ev.eventTime)}
                        </div>

                        {/* Currency */}
                        <div>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-muted/40 border border-border text-foreground/80">
                            {ev.currency}
                          </span>
                        </div>

                        {/* Impact */}
                        <div><ImpactChip impact={ev.impact} /></div>

                        {/* Event name */}
                        <div className="font-medium text-sm text-foreground truncate pr-2">{ev.eventName}</div>

                        {/* Actual */}
                        <div className="text-right">
                          {ev.actual ? (
                            <span className="flex items-center justify-end gap-1.5 font-mono text-sm font-semibold text-foreground">
                              {ev.actual}
                              <DeviationIcon actual={ev.actual} forecast={ev.forecast} />
                            </span>
                          ) : inlineActualId === ev.id ? (
                            <InlineActualInput
                              eventId={ev.id}
                              onSave={handleSaveActual}
                              onCancel={() => setInlineActualId(null)}
                              isPending={updateEvent.isPending}
                            />
                          ) : (
                            <button
                              className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                              onClick={() => setInlineActualId(ev.id)}
                            >
                              Enter actual
                            </button>
                          )}
                        </div>

                        {/* Forecast */}
                        <div className="text-right font-mono text-sm text-muted-foreground">
                          {ev.forecast || "—"}
                        </div>

                        {/* Previous */}
                        <div className="text-right font-mono text-sm text-muted-foreground">
                          {ev.previous || "—"}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => setEditEvent(ev)}
                            title="Edit event"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => setDeleteEvent(ev)}
                            title="Delete event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Modals ── */}
      <EventFormModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Add Event"
        defaultValues={DEFAULT_FORM}
        onSubmit={handleCreate}
        isPending={createEvent.isPending}
      />

      <EventFormModal
        open={!!editEvent}
        onOpenChange={(v) => !v && setEditEvent(null)}
        title="Edit Event"
        defaultValues={editDefaults}
        onSubmit={handleEdit}
        isPending={updateEvent.isPending}
      />

      <DeleteConfirmModal
        event={deleteEvent}
        onConfirm={handleDelete}
        onCancel={() => setDeleteEvent(null)}
        isPending={deleteEventMutation.isPending}
      />
    </div>
  );
}
