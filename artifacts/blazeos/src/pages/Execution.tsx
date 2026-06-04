import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Zap, Target, Eye, Clock, Plus, Trash2, CheckCircle2, Globe,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

type Bias = "Bullish" | "Bearish" | "Neutral";
type WatchlistItem = { id: string; symbol: string; note: string };
type LiqTarget = { id: string; level: string; description: string; hit: boolean };

const KILLZONES = [
  { name: "Asian Session", time: "00:00 – 03:00 EST", desc: "Range formation, liquidity build-up" },
  { name: "London Open", time: "03:00 – 05:00 EST", desc: "Institutional order flow begins" },
  { name: "London Session", time: "03:00 – 12:00 EST", desc: "Primary liquidity sweep zone" },
  { name: "NY Open Killzone", time: "08:00 – 10:00 EST", desc: "Highest volatility, best R:R setups" },
  { name: "NY Session", time: "08:00 – 17:00 EST", desc: "Continuation and reversals" },
  { name: "NY PM / Asia Overlap", time: "14:00 – 16:00 EST", desc: "Potential reversal setups" },
];

const CHECKLIST_ITEMS = [
  "Check economic calendar for high-impact news",
  "Mark daily / weekly key levels on chart",
  "Identify liquidity pools above and below price",
  "Confirm session bias (Bullish / Bearish / Neutral)",
  "Review yesterday's trades and journal",
  "Set max daily loss and risk parameters",
  "Identify top 2-3 trade setups for the session",
  "Review prop firm drawdown status",
  "Clear distractions — phone on silent",
  "Set price alerts at key levels",
];

export default function Execution() {
  const [dailyBias, setDailyBias] = useState<Bias>("Neutral");
  const [weeklyBias, setWeeklyBias] = useState<Bias>("Neutral");
  const [dailyNotes, setDailyNotes] = useState("");
  const [weeklyNotes, setWeeklyNotes] = useState("");
  const [sessionPlanLondon, setSessionPlanLondon] = useState("");
  const [sessionPlanNY, setSessionPlanNY] = useState("");
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { id: "1", symbol: "XAUUSD", note: "Watch London open for displacement" },
    { id: "2", symbol: "NAS100", note: "Gap fill potential above 18,200" },
  ]);
  const [liqTargets, setLiqTargets] = useState<LiqTarget[]>([]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [newSymbol, setNewSymbol] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [newLevelDesc, setNewLevelDesc] = useState("");

  const checklistDone = CHECKLIST_ITEMS.filter((_, i) => checklist[i]).length;

  const biasColor = (b: Bias) =>
    b === "Bullish" ? "text-green-400" : b === "Bearish" ? "text-red-400" : "text-white/40";

  const BiasSelector = ({
    value,
    onChange,
  }: {
    value: Bias;
    onChange: (b: Bias) => void;
  }) => (
    <div className="flex gap-2">
      {(["Bullish", "Neutral", "Bearish"] as Bias[]).map((b) => (
        <Button
          key={b}
          size="sm"
          variant={value === b ? "default" : "outline"}
          onClick={() => onChange(b)}
          className={
            value === b
              ? b === "Bullish"
                ? "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30"
                : b === "Bearish"
                ? "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
                : "bg-white/5 text-white/50 border-white/10"
              : "border-white/10 text-white/30"
          }
        >
          {b === "Bullish" ? <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> : b === "Bearish" ? <TrendingDown className="h-3.5 w-3.5 mr-1.5" /> : <Minus className="h-3.5 w-3.5 mr-1.5" />}
          {b}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Execution</h1>
            <p className="text-xs text-white/30 font-mono mt-0.5">
              Daily trading preparation — {format(new Date(), "EEEE, MMMM d")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-mono text-white/30">
            Checklist: {checklistDone}/{CHECKLIST_ITEMS.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Bias + Sessions */}
        <div className="xl:col-span-2 space-y-4">
          {/* Bias Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#0d0d14] border-white/[0.06]">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Daily Bias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <BiasSelector value={dailyBias} onChange={setDailyBias} />
                <Textarea
                  value={dailyNotes}
                  onChange={(e) => setDailyNotes(e.target.value)}
                  placeholder="Market structure, key levels, today's narrative..."
                  className="min-h-[100px] bg-background border-white/[0.08] text-sm font-mono resize-none text-white/60"
                />
              </CardContent>
            </Card>

            <Card className="bg-[#0d0d14] border-white/[0.06]">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  Weekly Bias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <BiasSelector value={weeklyBias} onChange={setWeeklyBias} />
                <Textarea
                  value={weeklyNotes}
                  onChange={(e) => setWeeklyNotes(e.target.value)}
                  placeholder="Higher timeframe narrative, weekly targets..."
                  className="min-h-[100px] bg-background border-white/[0.08] text-sm font-mono resize-none text-white/60"
                />
              </CardContent>
            </Card>
          </div>

          {/* Session Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#0d0d14] border-white/[0.06]">
              <CardHeader className="pb-3 border-b border-white/[0.04]">
                <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-blue-400" />
                  London Session
                  <Badge className="ml-auto text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                    03:00–12:00 EST
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <Textarea
                  value={sessionPlanLondon}
                  onChange={(e) => setSessionPlanLondon(e.target.value)}
                  placeholder="London open plan — sweep direction, target levels, setup type expected..."
                  className="min-h-[110px] bg-background border-white/[0.08] text-sm font-mono resize-none text-white/60"
                />
              </CardContent>
            </Card>

            <Card className="bg-[#0d0d14] border-white/[0.06]">
              <CardHeader className="pb-3 border-b border-white/[0.04]">
                <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-orange-400" />
                  New York Session
                  <Badge className="ml-auto text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/20">
                    08:00–17:00 EST
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <Textarea
                  value={sessionPlanNY}
                  onChange={(e) => setSessionPlanNY(e.target.value)}
                  placeholder="NY open killzone plan — continuation or reversal, key price levels, confluence..."
                  className="min-h-[110px] bg-background border-white/[0.08] text-sm font-mono resize-none text-white/60"
                />
              </CardContent>
            </Card>
          </div>

          {/* Liquidity Targets */}
          <Card className="bg-[#0d0d14] border-white/[0.06]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-yellow-400" />
                Liquidity Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Price level (e.g. 2341.50)"
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="bg-background border-white/[0.08] text-sm font-mono flex-1"
                />
                <Input
                  placeholder="Description (BSL, SSL, FVG...)"
                  value={newLevelDesc}
                  onChange={(e) => setNewLevelDesc(e.target.value)}
                  className="bg-background border-white/[0.08] text-sm flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10"
                  onClick={() => {
                    if (!newLevel.trim()) return;
                    setLiqTargets((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), level: newLevel, description: newLevelDesc, hit: false },
                    ]);
                    setNewLevel("");
                    setNewLevelDesc("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {liqTargets.length === 0 ? (
                <p className="text-xs text-white/20 font-mono text-center py-3">
                  No liquidity targets added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {liqTargets.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-md border ${
                        t.hit ? "bg-green-500/5 border-green-500/20" : "bg-white/[0.02] border-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            setLiqTargets((prev) =>
                              prev.map((x) => (x.id === t.id ? { ...x, hit: !x.hit } : x))
                            )
                          }
                        >
                          <CheckCircle2
                            className={`h-4 w-4 ${t.hit ? "text-green-400" : "text-white/20"}`}
                          />
                        </button>
                        <span className={`font-mono text-sm font-bold ${t.hit ? "text-green-400 line-through opacity-50" : "text-white/70"}`}>
                          {t.level}
                        </span>
                        <span className="text-xs text-white/30">{t.description}</span>
                      </div>
                      <button
                        onClick={() => setLiqTargets((prev) => prev.filter((x) => x.id !== t.id))}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Killzones */}
          <Card className="bg-[#0d0d14] border-white/[0.06]">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Killzones Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {KILLZONES.map((kz) => (
                  <div
                    key={kz.name}
                    className="p-3 rounded-md bg-white/[0.02] border border-white/[0.04] hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-white/70">{kz.name}</span>
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 font-mono">
                        {kz.time}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-white/30 mt-1 font-mono">{kz.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Watchlist + Checklist */}
        <div className="space-y-4">
          {/* Watchlist */}
          <Card className="bg-[#0d0d14] border-white/[0.06]">
            <CardHeader className="pb-3 border-b border-white/[0.04]">
              <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Symbol"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  className="bg-background border-white/[0.08] text-sm font-mono w-28"
                />
                <Input
                  placeholder="Note / setup"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="bg-background border-white/[0.08] text-sm flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10"
                  onClick={() => {
                    if (!newSymbol.trim()) return;
                    setWatchlist((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), symbol: newSymbol, note: newNote },
                    ]);
                    setNewSymbol("");
                    setNewNote("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div>
                      <span className="text-sm font-bold font-mono text-white/80">{item.symbol}</span>
                      {item.note && (
                        <p className="text-xs text-white/30 mt-0.5">{item.note}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setWatchlist((prev) => prev.filter((x) => x.id !== item.id))}
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trading Checklist */}
          <Card className="bg-[#0d0d14] border-white/[0.06]">
            <CardHeader className="pb-3 border-b border-white/[0.04]">
              <CardTitle className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                Pre-Trade Checklist
                <Badge className={`ml-auto text-[10px] font-mono ${checklistDone === CHECKLIST_ITEMS.length ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-white/30 border-white/10"}`}>
                  {checklistDone}/{CHECKLIST_ITEMS.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              {CHECKLIST_ITEMS.map((item, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <Checkbox
                    checked={!!checklist[i]}
                    onCheckedChange={(checked) =>
                      setChecklist((prev) => ({ ...prev, [i]: !!checked }))
                    }
                    className="mt-0.5 border-white/20 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  <span
                    className={`text-xs leading-relaxed transition-colors ${
                      checklist[i]
                        ? "text-white/25 line-through"
                        : "text-white/50 group-hover:text-white/70"
                    }`}
                  >
                    {item}
                  </span>
                </label>
              ))}
              {checklistDone === CHECKLIST_ITEMS.length && (
                <div className="mt-3 p-2.5 rounded-md bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  <span className="text-xs text-green-400 font-mono">
                    All checks passed — you are cleared to trade.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
