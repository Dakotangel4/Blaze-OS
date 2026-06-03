import { useEffect, useState } from "react";
import { useGetTradeStats, useListCalendarEvents } from "@workspace/api-client-react";

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useNextEventCountdown() {
  const { data: events } = useListCalendarEvents({});
  const now = useLiveClock();

  const nextEvent = (events as any[])
    ?.filter((e: any) => {
      if (!e.eventTime) return false;
      const d = new Date(e.eventTime);
      return !isNaN(d.getTime()) && d > now;
    })
    .sort((a: any, b: any) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime())[0];

  if (!nextEvent) return { label: "No upcoming events", countdown: null };

  const diff = new Date(nextEvent.eventTime).getTime() - now.getTime();
  if (diff <= 0) return { label: nextEvent.eventName, countdown: "NOW" };

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const parts = h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;

  return { label: nextEvent.eventName, countdown: parts };
}

export function SessionBar() {
  const now = useLiveClock();
  const { data: stats } = useGetTradeStats();
  const { label, countdown } = useNextEventCountdown();

  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", weekday: "short" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const pnlPositive = (stats?.totalPnl ?? 0) >= 0;

  return (
    <div
      className="w-full flex items-center justify-between px-5 py-2 border-b border-white/[0.06] text-xs font-mono"
      style={{ backgroundColor: "#0B0F17" }}
    >
      <span className="text-white/40">
        📅 {dateStr} · {timeStr} GMT
      </span>

      <div className="flex items-center gap-6 text-white/60">
        <span>
          P&amp;L:{" "}
          <span className={pnlPositive ? "text-green-400" : "text-red-400"}>
            {pnlPositive ? "+" : ""}${(stats?.totalPnl ?? 0).toFixed(2)}
          </span>
        </span>
        <span>
          Win Rate:{" "}
          <span className="text-white/80">
            {stats?.winRate ? (stats.winRate * 100).toFixed(0) : 0}%
          </span>
        </span>
        <span>
          Avg Risk:{" "}
          <span className="text-white/80">{(stats?.avgRisk ?? 0).toFixed(1)}%</span>
        </span>
        <span>
          Trades:{" "}
          <span className="text-white/80">{stats?.totalTrades ?? 0}</span>
        </span>
        {countdown && (
          <span className="flex items-center gap-1.5">
            <span className="text-white/40 truncate max-w-[120px]">{label}:</span>
            <span className="text-yellow-400 font-bold">{countdown}</span>
          </span>
        )}
      </div>
    </div>
  );
}
