import { useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowRight, AlertTriangle, Clock } from "lucide-react";
import { useListCalendarEvents } from "@workspace/api-client-react";
import type { CalendarEvent } from "@workspace/api-client-react";
import { formatTimeGMT1, getDateKeyGMT1, getTodayKeyGMT1 } from "@/utils/calendarUtils";

function getCountdown(iso: string): string | null {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = then - now;
  if (diff <= 0 || diff > 8 * 60 * 60 * 1000) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `in ${h}h ${m}m`;
  if (m > 0) return `in ${m}m`;
  return "now";
}

const IMPACT_STYLES: Record<string, { dot: string }> = {
  High:   { dot: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.7)]"    },
  Medium: { dot: "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]" },
  Low:    { dot: "bg-gray-500"                                          },
};

function EventRow({ ev }: { ev: CalendarEvent }) {
  const s = IMPACT_STYLES[ev.impact] ?? IMPACT_STYLES.Low;
  const countdown = getCountdown(ev.eventTime);
  const released  = !!ev.actual;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      {/* Time */}
      <div className="w-11 shrink-0 text-center">
        <div className="font-mono text-sm font-bold tabular-nums text-foreground/80">
          {formatTimeGMT1(ev.eventTime)}
        </div>
      </div>

      {/* Impact dot */}
      <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />

      {/* Currency + Event */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted/40 border border-border text-foreground/70">
            {ev.currency}
          </span>
          <span className="text-sm font-medium text-foreground truncate">{ev.eventName}</span>
        </div>
        {ev.forecast && (
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Forecast: <span className="font-mono">{ev.forecast}</span>
            {ev.previous && <> · Prev: <span className="font-mono">{ev.previous}</span></>}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="shrink-0 text-right">
        {released ? (
          <div>
            <div className="font-mono text-sm font-bold text-foreground">{ev.actual}</div>
            <div className="text-[10px] text-muted-foreground">released</div>
          </div>
        ) : countdown ? (
          <Badge className="text-[10px] bg-primary/15 text-primary border-primary/25 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {countdown}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground font-mono">—</span>
        )}
      </div>
    </div>
  );
}

export function TodayEventsWidget() {
  const { data: allEvents, isLoading } = useListCalendarEvents();

  const todayKey = getTodayKeyGMT1();

  const todayEvents = useMemo<CalendarEvent[]>(() => {
    if (!allEvents) return [];
    return (allEvents as CalendarEvent[])
      .filter((e: CalendarEvent) => {
        try {
          return getDateKeyGMT1(e.eventTime) === todayKey && !isNaN(new Date(e.eventTime).getTime());
        } catch { return false; }
      })
      .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime())
      .slice(0, 5);
  }, [allEvents, todayKey]);

  const highCount = (todayEvents as CalendarEvent[]).filter((e: CalendarEvent) => e.impact === "High").length;
  const totalToday = (allEvents as CalendarEvent[] | undefined)?.filter((e: CalendarEvent) => {
    try { return getDateKeyGMT1(e.eventTime) === todayKey; } catch { return false; }
  }).length ?? 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-primary" />
          Today's Economic Events
          {highCount > 0 && (
            <Badge className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-red-500/15 text-red-400 border-red-500/25 flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />
              {highCount} high impact
            </Badge>
          )}
        </CardTitle>
        <Link href="/economic-calendar">
          <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            Full calendar <ArrowRight className="h-3 w-3" />
          </button>
        </Link>
      </CardHeader>

      <CardContent className="p-0 px-4">
        {isLoading ? (
          <div className="py-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : todayEvents.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">No events scheduled for today</p>
            <Link href="/economic-calendar">
              <button className="mt-2 text-xs text-primary hover:underline">
                View full calendar →
              </button>
            </Link>
          </div>
        ) : (
          <div>
            {todayEvents.map((ev: CalendarEvent) => <EventRow key={ev.id} ev={ev} />)}
            {totalToday > 5 && (
              <div className="py-2 text-center">
                <Link href="/economic-calendar">
                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    +{totalToday - 5} more today · View all →
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
