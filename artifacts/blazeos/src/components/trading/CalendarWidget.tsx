import { useListCalendarEvents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFormatDate } from "@/utils/dateSafe";

const impactColor: Record<string, string> = {
  High: "text-red-400 bg-red-500/10 border-red-500/20",
  Medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Low: "text-white/30 bg-white/5 border-white/10",
};

export function CalendarWidget() {
  const { data: events, isLoading } = useListCalendarEvents({});

  const now = new Date();
  const upcoming = (events as any[])
    ?.filter((e: any) => {
      if (!e.eventTime) return false;
      const d = new Date(e.eventTime);
      return !isNaN(d.getTime()) && d >= now;
    })
    .sort((a: any, b: any) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime())
    .slice(0, 5) ?? [];

  return (
    <div className="rounded-xl border border-white/[0.08] p-4" style={{ backgroundColor: "#111827" }}>
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Upcoming Events</h2>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full bg-white/5" />)}
        </div>
      ) : upcoming.length === 0 ? (
        <p className="text-xs text-white/25 py-4 text-center">No upcoming events.</p>
      ) : (
        <div className="space-y-1.5">
          {upcoming.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
              <div className="font-mono text-[10px] text-white/35 w-10 shrink-0">
                {safeFormatDate(e.eventTime, "HH:mm")}
              </div>
              <div className="flex-1 text-xs text-white/60 truncate">{e.eventName}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-white/30">{e.currency}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${impactColor[e.impact] ?? impactColor.Low}`}>
                  {e.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
