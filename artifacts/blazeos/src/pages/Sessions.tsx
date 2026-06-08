import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionDef {
  name: string;
  open: number;
  close: number;
  color: string;
  killZones: string[];
  pairs: string[];
}

const SESSIONS: SessionDef[] = [
  { name: "Sydney", open: 22, close: 6, color: "#10b981", killZones: ["22:00–23:00 UTC"], pairs: ["AUD/USD", "NZD/USD", "AUD/JPY"] },
  { name: "Tokyo", open: 0, close: 9, color: "#06b6d4", killZones: ["00:00–01:00 UTC", "08:00–09:00 UTC"], pairs: ["USD/JPY", "EUR/JPY", "GBP/JPY"] },
  { name: "London", open: 7, close: 16, color: "#ff6200", killZones: ["07:00–09:00 UTC", "11:00–12:00 UTC"], pairs: ["EUR/USD", "GBP/USD", "XAU/USD"] },
  { name: "New York", open: 12, close: 21, color: "#3b82f6", killZones: ["13:00–15:00 UTC", "19:00–20:00 UTC"], pairs: ["EUR/USD", "NAS100", "US30"] },
];

function isActive(s: SessionDef, h: number) {
  return s.open > s.close ? h >= s.open || h < s.close : h >= s.open && h < s.close;
}

function minsUntil(targetH: number, curH: number, curM: number) {
  const cur = curH * 60 + curM;
  const tar = targetH * 60;
  const diff = tar - cur;
  return diff > 0 ? diff : diff + 24 * 60;
}

function fmtCountdown(m: number) {
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

export default function Sessions() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const activeSessions = SESSIONS.filter((s) => isActive(s, utcH));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Sessions</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Global trading session tracker</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-mono bg-muted/30 px-3 py-2 rounded-xl">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {String(utcH).padStart(2, "0")}:{String(utcM).padStart(2, "0")} UTC
        </div>
      </div>

      <Card className={cn("border-2", activeSessions.length > 0 ? "border-primary/40 bg-primary/5" : "border-border/40")}>
        <CardContent className="p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Currently Active</div>
          {activeSessions.length === 0 ? (
            <div className="text-lg font-bold text-muted-foreground">Markets Closed</div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {activeSessions.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ backgroundColor: s.color }} />
                  <span className="text-lg font-bold">{s.name}</span>
                </div>
              ))}
              {activeSessions.length > 1 && (
                <Badge className="bg-primary/20 text-primary border-primary/40 text-xs">Overlap — High Volume</Badge>
              )}
            </div>
          )}
          <div className="mt-2 text-xs text-muted-foreground">
            Local: {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SESSIONS.map((session) => {
          const active = isActive(session, utcH);
          const minsToOpen = minsUntil(session.open, utcH, utcM);

          return (
            <Card key={session.name} className={cn("border-2 transition-all", active ? "border-opacity-60" : "border-border/40")}
              style={active ? { borderColor: session.color + "60" } : undefined}>
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-3 w-3 rounded-full shrink-0", active ? "animate-pulse" : "opacity-25")} style={{ backgroundColor: session.color }} />
                    <CardTitle className="text-base font-bold">{session.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={cn("text-xs", active ? "border-green-500/40 text-green-400" : "border-border text-muted-foreground")}>
                    {active ? "OPEN" : fmtCountdown(minsToOpen)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/20 rounded-lg p-2.5">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Open UTC</div>
                    <div className="font-mono font-semibold">{String(session.open).padStart(2, "0")}:00</div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2.5">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Close UTC</div>
                    <div className="font-mono font-semibold">{String(session.close).padStart(2, "0")}:00</div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2.5">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Open Local</div>
                    <div className="font-mono font-semibold text-xs">
                      {new Date(new Date().setUTCHours(session.open, 0, 0, 0)).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2.5">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Close Local</div>
                    <div className="font-mono font-semibold text-xs">
                      {new Date(new Date().setUTCHours(session.close, 0, 0, 0)).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Kill Zones</div>
                  {session.killZones.map((kz) => (
                    <div key={kz} className="flex items-center gap-1.5 text-xs py-0.5">
                      <div className="h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: session.color }} />
                      <span className="font-mono">{kz}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {session.pairs.map((pair) => (
                    <span key={pair} className="text-xs font-mono px-2 py-1 rounded-lg bg-muted/40 text-muted-foreground">{pair}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/40">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">24-Hour Timeline (UTC)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="relative h-10 min-w-0">
            <div className="absolute inset-0 bg-muted/20 rounded-lg" />
            {SESSIONS.map((s) => {
              const startPct = s.open > s.close ? 0 : (s.open / 24) * 100;
              const widthPct = s.open > s.close ? ((24 - s.open + s.close) / 24) * 100 : ((s.close - s.open) / 24) * 100;
              const active = isActive(s, utcH);
              return (
                <div key={s.name} className="absolute top-1 h-8 rounded-md flex items-center justify-center transition-all"
                  style={{ left: `${startPct}%`, width: `${widthPct}%`, backgroundColor: s.color + (active ? "50" : "25"), borderLeft: `2px solid ${s.color}` }}>
                  <span className="text-[9px] font-bold hidden sm:block" style={{ color: s.color }}>{s.name.slice(0, 3)}</span>
                </div>
              );
            })}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10 transition-all"
              style={{ left: `${((utcH + utcM / 60) / 24) * 100}%` }}>
              <div className="absolute -top-1 -left-[3px] h-2 w-2 rounded-full bg-white" />
            </div>
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-1">
            {[0, 6, 12, 18, 24].map((h) => (
              <span key={h}>{String(h % 24).padStart(2, "0")}:00</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
