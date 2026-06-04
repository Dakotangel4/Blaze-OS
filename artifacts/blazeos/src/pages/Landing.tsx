import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Flame, TrendingUp, Bot, BookOpen, BarChart3,
  Shield, Zap, Activity, ArrowRight, ChevronRight, Calendar,
  CheckCircle2, Star, Globe, Lock, Users, DollarSign,
} from "lucide-react";

/* ─── Animations ──────────────────────────────────────────────── */
const STYLES = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ticker-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.8; }
  }
  @keyframes bar-grow {
    from { height: 0; }
  }
  .animated-gradient {
    background-size: 200% 200%;
    animation: gradient-x 4s ease infinite;
  }
  .float-anim { animation: float 6s ease-in-out infinite; }
  .fade-up-1  { animation: fade-up 0.6s ease both 0.1s; }
  .fade-up-2  { animation: fade-up 0.6s ease both 0.25s; }
  .fade-up-3  { animation: fade-up 0.6s ease both 0.4s; }
  .fade-up-4  { animation: fade-up 0.6s ease both 0.55s; }
  .ticker-track { animation: ticker-scroll 35s linear infinite; display: inline-flex; }
  .glow-blob  { animation: pulse-glow 4s ease-in-out infinite; }
`;

/* ─── Data ────────────────────────────────────────────────────── */
const STATS = [
  { value: "50K+",  label: "Trades logged"      },
  { value: "2,400+", label: "Active traders"    },
  { value: "99.9%", label: "Platform uptime"    },
  { value: "6",     label: "Integrated modules" },
];

const FEATURES = [
  {
    icon: TrendingUp, color: "text-green-400",   bg: "bg-green-400/10",  border: "border-green-400/20",
    title: "Trading Hub",
    desc: "Log every trade with full context — entry, exit, setup, session. Get win rate, R:R, and P&L breakdowns automatically.",
    tags: ["Trade Journal", "P&L Analytics", "Setup Library"],
  },
  {
    icon: Bot, color: "text-primary",            bg: "bg-primary/10",    border: "border-primary/20",
    title: "AI Command Center",
    desc: "Run four institutional-grade AI tools using GPT-4, Claude, or Perplexity. Analyze trades, generate daily bias, summarize journals.",
    tags: ["Trade Analyzer", "Daily Bias", "Journal Summary"],
  },
  {
    icon: BookOpen, color: "text-blue-400",      bg: "bg-blue-400/10",   border: "border-blue-400/20",
    title: "Knowledge Vault",
    desc: "Your personal trading library. Store playbooks, strategies, and annotated setups so insights never get lost.",
    tags: ["Playbooks", "Strategy Notes", "Tagged Search"],
  },
  {
    icon: Shield, color: "text-orange-400",      bg: "bg-orange-400/10", border: "border-orange-400/20",
    title: "Prop Firm Tracker",
    desc: "Monitor every prop challenge and funded account with live drawdown progress bars, payout eligibility alerts, and rule-violation warnings.",
    tags: ["Drawdown Monitor", "Phase Tracking", "Payout Alerts"],
  },
  {
    icon: BarChart3, color: "text-yellow-400",   bg: "bg-yellow-400/10", border: "border-yellow-400/20",
    title: "Analytics",
    desc: "Visualize your equity curve, monthly returns, win/loss distribution, and session performance — all from your logged trades.",
    tags: ["Equity Curve", "Session Stats", "Symbol Breakdown"],
  },
  {
    icon: Calendar, color: "text-red-400",       bg: "bg-red-400/10",    border: "border-red-400/20",
    title: "Economic Calendar",
    desc: "Never trade blind into high-impact news. Your calendar surfaces CPI, NFP, FOMC, and earnings in a clean timeline.",
    tags: ["High-Impact Events", "Countdown Timers", "Asset Tags"],
  },
];

const MODULES = [
  {
    badge: "TRADE JOURNAL", icon: TrendingUp, color: "text-green-400",
    headline: "Every trade. Every insight. Nothing lost.",
    desc: "BlazeOS captures your full trade lifecycle — from setup confluence to post-trade review. Built-in stats surface your best sessions, worst habits, and hidden edge automatically.",
    bullets: [
      "Auto-calculate Win Rate, Avg R:R, and Net P&L",
      "Filter by session, asset, setup type, or date",
      "Tag entries with SMC, ICT, or custom methodologies",
      "Replay your week with one-click journal summaries",
    ],
    mockup: <TradingMockup />,
  },
  {
    badge: "AI COMMAND CENTER", icon: Bot, color: "text-primary",
    headline: "Institutional-grade AI. Four tools. Zero guesswork.",
    desc: "Connect your own OpenAI, Claude, or Perplexity key and unlock four purpose-built tools that understand how professional traders think.",
    bullets: [
      "Trade Analyzer — score any trade 1–10 with reasoning",
      "Daily Bias Generator — get your institutional briefing",
      "Journal Summary — weekly performance in seconds",
      "Client Proposal — draft winning proposals for coaching clients",
    ],
    mockup: <AIMockup />,
  },
  {
    badge: "PROP FIRM TRACKER", icon: Shield, color: "text-orange-400",
    headline: "Never blow a prop account again.",
    desc: "Track every challenge and funded account in one place. Real-time drawdown monitoring, payout eligibility flags, and rule-violation alerts keep you on the right side of your prop firm at all times.",
    bullets: [
      "Live max drawdown and daily drawdown progress bars",
      "Payout eligibility badge when profit target is hit",
      "Red warning when you exceed 70% of max drawdown",
      "FTMO, FundedNext, Goat Funded presets built in",
    ],
    mockup: <CRMMockup />,
  },
];

const TESTIMONIALS = [
  {
    initials: "MK",  name: "Marcus K.",  role: "Prop Trader",
    text: "BlazeOS replaced 4 apps I was paying for separately. The AI Command Center alone is worth the entire subscription — my daily bias reports are now a 90-second exercise.",
    stars: 5,
  },
  {
    initials: "SA",  name: "Sophia A.", role: "Trading Coach",
    text: "The CRM and client proposal tool changed how I run my coaching business. I used to spend two hours writing proposals. Now it's five minutes.",
    stars: 5,
  },
  {
    initials: "JR",  name: "James R.",  role: "Futures Trader",
    text: "The trade journal is the most honest tool I've ever used. It doesn't let me lie to myself about my performance. My win rate went from 51% to 68% in 3 months.",
    stars: 5,
  },
];

const TICKER = [
  { symbol: "XAUUSD", price: "2,341.50", change: "+0.34%", up: true  },
  { symbol: "NAS100", price: "18,245.30",change: "+1.23%", up: true  },
  { symbol: "BTCUSD", price: "67,432.10",change: "+2.15%", up: true  },
  { symbol: "EURUSD", price: "1.0856",   change: "-0.12%", up: false },
  { symbol: "USDJPY", price: "155.43",   change: "+0.45%", up: true  },
  { symbol: "SPX500", price: "5,234.18", change: "+0.78%", up: true  },
  { symbol: "UKOIL",  price: "82.34",    change: "+1.56%", up: true  },
  { symbol: "DXY",    price: "104.23",   change: "-0.23%", up: false },
];

/* ─── Hero Dashboard Mockup ───────────────────────────────────── */
const CHART_BARS = [30, 52, 38, 68, 45, 82, 58, 74, 50, 91, 63, 85, 72, 95];

function HeroDashboard() {
  return (
    <div className="relative w-full max-w-[640px] float-anim">
      {/* Glow behind the card */}
      <div className="absolute -inset-8 bg-primary/10 blur-[60px] rounded-full glow-blob pointer-events-none" />
      <div className="absolute -inset-4 bg-blue-500/5 blur-[40px] rounded-2xl pointer-events-none" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0d14] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.6)]">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <div className="ml-3 flex-1 h-5 bg-white/[0.04] rounded-md" />
          <div className="flex items-center gap-1.5 ml-3">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-white/20">LIVE</span>
          </div>
        </div>

        <div className="flex h-[320px] md:h-[380px]">
          {/* Sidebar */}
          <div className="w-12 border-r border-white/[0.05] bg-black/20 flex flex-col items-center py-4 gap-4">
            <div className="h-6 w-6 rounded-md bg-primary/20 flex items-center justify-center">
              <Flame className="h-3 w-3 text-primary" />
            </div>
            {[TrendingUp, Bot, BookOpen, Users, DollarSign, Calendar].map((Icon, i) => (
              <div key={i} className={`h-6 w-6 rounded-md flex items-center justify-center ${i === 0 ? "bg-white/[0.08]" : ""}`}>
                <Icon className={`h-3 w-3 ${i === 0 ? "text-white/70" : "text-white/20"}`} />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            {/* Top metrics */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "NET P&L",   value: "+$14,320",color: "text-green-400" },
                { label: "WIN RATE",  value: "71.2%",   color: "text-primary"   },
                { label: "OPEN",      value: "4 Trades",color: "text-white/70"  },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5">
                  <div className="text-[9px] font-mono text-white/25 tracking-widest mb-1">{m.label}</div>
                  <div className={`text-sm font-black font-mono ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-white/25 tracking-widest">P&L CURVE — 14 WEEKS</span>
                <span className="text-[10px] font-mono text-green-400 font-bold">+43.8%</span>
              </div>
              <div className="flex items-end gap-[3px] h-16">
                {CHART_BARS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background: i >= CHART_BARS.length - 2
                        ? "hsl(var(--primary))"
                        : i >= CHART_BARS.length - 4
                        ? "rgba(74,222,128,0.5)"
                        : `rgba(99,102,241,${0.25 + (h / 100) * 0.45})`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Trade rows */}
            <div className="space-y-1.5">
              {[
                { pair: "XAUUSD", side: "LONG",  pnl: "+$840",  r: "+2.1R", win: true  },
                { pair: "NAS100", side: "SHORT", pnl: "-$210",  r: "-0.5R", win: false },
                { pair: "BTCUSD", side: "LONG",  pnl: "+$1,120",r: "+2.8R", win: true  },
              ].map((t) => (
                <div key={t.pair} className="flex items-center justify-between rounded bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white/60">{t.pair}</span>
                    <span className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold ${t.side === "LONG" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{t.side}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/30">{t.r}</span>
                    <span className={`text-xs font-mono font-bold ${t.win ? "text-green-400" : "text-red-400"}`}>{t.pnl}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side mini panel */}
          <div className="hidden md:flex w-36 border-l border-white/[0.05] bg-black/10 flex-col p-3 gap-3">
            <div className="text-[9px] font-mono text-white/20 tracking-widest">LIVE MARKETS</div>
            {TICKER.slice(0, 4).map((t) => (
              <div key={t.symbol} className="space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-white/50 font-bold">{t.symbol}</span>
                  <span className={`text-[9px] font-mono font-bold ${t.up ? "text-green-400" : "text-red-400"}`}>{t.change}</span>
                </div>
                <div className="text-[10px] font-mono text-white/30">{t.price}</div>
              </div>
            ))}
            <div className="mt-auto space-y-1">
              <div className="text-[9px] font-mono text-white/15 tracking-widest">AI STATUS</div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-mono text-white/30">GPT-4o Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom ticker */}
        <div className="border-t border-white/[0.05] bg-black/30 py-1.5 overflow-hidden">
          <div className="ticker-track whitespace-nowrap">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-4 text-[10px] font-mono border-r border-white/[0.05]">
                <span className="text-white/40">{t.symbol}</span>
                <span className={t.up ? "text-green-400" : "text-red-400"}>{t.change}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Module Mockups ──────────────────────────────────────────── */
function TradingMockup() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0a0d14] overflow-hidden shadow-2xl">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
        <div className="h-2 w-2 rounded-full bg-red-500/60" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
        <div className="h-2 w-2 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[10px] font-mono text-white/20">TRADING HUB</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {[["TRADES","48"],["WIN RATE","72.9%"],["NET P&L","+$18,430"],["AVG R:R","1:2.6"]].map(([l,v])=>(
            <div key={l} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]">
              <div className="text-[9px] font-mono text-white/25 tracking-widest">{l}</div>
              <div className="text-sm font-black font-mono text-white/80 mt-0.5">{v}</div>
            </div>
          ))}
        </div>
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.05] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-white/25">RECENT TRADES</span>
            <span className="text-[10px] font-mono text-primary">View all →</span>
          </div>
          {[
            ["XAUUSD","LONG","London","ICT BOS","Win","+$640","+2.1R"],
            ["NAS100","LONG","NY Open","SMC OB","Win","+$920","+2.3R"],
            ["BTCUSD","SHORT","Asia","Supply Zone","Loss","-$200","-0.5R"],
            ["GBPUSD","LONG","London","FVG Retest","Win","+$380","+1.9R"],
          ].map(([pair,side,sess,setup,res,pnl,r])=>(
            <div key={pair+sess} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0 text-[10px] font-mono">
              <span className="text-white/60 font-bold w-16">{pair}</span>
              <span className={`px-1 rounded text-[9px] font-bold ${side==="LONG"?"bg-green-500/15 text-green-400":"bg-red-500/15 text-red-400"}`}>{side}</span>
              <span className="text-white/25 hidden sm:block">{sess}</span>
              <span className="text-white/25 hidden md:block">{setup}</span>
              <span className={res==="Win"?"text-green-400":"text-red-400"}>{pnl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIMockup() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0a0d14] overflow-hidden shadow-2xl">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
        <div className="h-2 w-2 rounded-full bg-red-500/60" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
        <div className="h-2 w-2 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[10px] font-mono text-white/20">AI COMMAND CENTER — TRADE ANALYZER</span>
      </div>
      <div className="p-4 space-y-3 font-mono">
        <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/30 tracking-widest">TRADE SCORE</span>
            <span className="text-[9px] px-2 py-0.5 rounded border border-green-400/30 text-green-400 bg-green-400/10 font-bold">ELITE SETUP</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black text-green-400">8</span>
            <div className="flex-1">
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4,5,6,7,8,9,10].map(i=>(
                  <div key={i} className={`h-2 flex-1 rounded-sm ${i<=8?"bg-green-400":"bg-white/10"}`} />
                ))}
              </div>
              <span className="text-[10px] text-white/30">/ 10 institutional score</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5 space-y-1">
            <div className="text-[9px] text-green-400 tracking-widest font-bold">STRENGTHS</div>
            {["Clear OB entry point","Strong session timing","Tight stop placement"].map(s=>(
              <div key={s} className="flex gap-1.5 text-[10px] text-white/50"><span className="text-green-400">▸</span>{s}</div>
            ))}
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5 space-y-1">
            <div className="text-[9px] text-yellow-400 tracking-widest font-bold">IMPROVE</div>
            {["Scale at 1:1 profit","Avoid Friday entries","Log macro context"].map(s=>(
              <div key={s} className="flex gap-1.5 text-[10px] text-white/50"><span className="text-yellow-400">▸</span>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CRMMockup() {
  const cols = [
    { label: "LEADS",   color: "border-blue-400/30",  bg: "bg-blue-400/5",  items: ["Sarah Chen","Mike Torres","Anna Schmidt"] },
    { label: "ACTIVE",  color: "border-green-400/30", bg: "bg-green-400/5", items: ["James Liu","Priya Nair"] },
    { label: "CLOSED",  color: "border-white/20",     bg: "bg-white/[0.02]",items: ["David Park","Emma Walsh","Carlos G."] },
  ];
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0a0d14] overflow-hidden shadow-2xl">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
        <div className="h-2 w-2 rounded-full bg-red-500/60" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
        <div className="h-2 w-2 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[10px] font-mono text-white/20">CLIENT CRM — PIPELINE</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {cols.map((col)=>(
            <div key={col.label} className={`rounded-lg border ${col.color} ${col.bg} p-2.5 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/30 tracking-widest">{col.label}</span>
                <span className="text-[9px] font-mono text-white/20">{col.items.length}</span>
              </div>
              {col.items.map(name=>(
                <div key={name} className="bg-black/20 rounded-md px-2 py-1.5 border border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                      {name[0]}
                    </div>
                    <span className="text-[10px] font-mono text-white/55">{name}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Count-up hook ───────────────────────────────────────────── */
function useCountUp(target: string, duration = 1600) {
  const [display, setDisplay] = useState("0");
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const num = parseFloat(target.replace(/[^0-9.]/g, ""));
    const suffix = target.replace(/[0-9.,]/g, "").trim();
    if (isNaN(num)) { setDisplay(target); return; }
    const steps = 40;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * num * 10) / 10;
      const formatted = current >= 1000 ? current.toLocaleString() : current.toString();
      setDisplay(formatted + suffix);
      if (step >= steps) { setDisplay(target); clearInterval(id); }
    }, duration / steps);
    return () => clearInterval(id);
  }, [target, duration]);
  return display;
}

function StatCard({ value, label }: { value: string; label: string }) {
  const display = useCountUp(value);
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-black text-white tracking-tighter">{display}</div>
      <div className="text-sm text-white/35 mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ─── Nav ─────────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#060810]/90 backdrop-blur-xl border-b border-white/[0.06]" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Flame className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">BlazeOS</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "Modules", "Testimonials"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-white/40 hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <button className="text-sm text-white/50 hover:text-white transition-colors px-3 py-1.5">
              Sign In
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all active:scale-95">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-20 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[#060810]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-primary/10 blur-[120px] glow-blob pointer-events-none" />
      <div className="absolute top-2/3 left-1/4 w-[400px] h-[300px] rounded-full bg-blue-500/8 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 w-full">
        <div className="flex flex-col xl:flex-row items-center gap-16 xl:gap-20">
          {/* Left: Copy */}
          <div className="flex-1 text-center xl:text-left">
            <div className="fade-up-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-medium text-white/50 mb-6 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Institutional-Grade Command Center
              <span className="text-white/20">—</span>
              Trusted by 2,400+ traders
            </div>

            <h1 className="fade-up-2 text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-6">
              <span className="text-white">The Operating<br />System for </span>
              <span
                className="animated-gradient bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), #f59e0b, #f97316)" }}
              >
                Elite Traders
              </span>
              <span className="text-white">.</span>
            </h1>

            <p className="fade-up-3 text-lg md:text-xl text-white/40 max-w-xl xl:max-w-lg mx-auto xl:mx-0 leading-relaxed mb-8">
              Analyze markets, manage clients, track performance, and build your knowledge base — all from one institutional-grade dashboard.
            </p>

            <div className="fade-up-4 flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-3 mb-12">
              <Link href="/sign-up">
                <button className="group h-12 px-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_40px_rgba(255,128,0,0.25)] hover:shadow-[0_0_56px_rgba(255,128,0,0.4)]">
                  Start Free Today
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="h-12 px-7 rounded-xl border border-white/[0.1] hover:border-white/20 text-white/60 hover:text-white text-sm font-medium transition-all bg-white/[0.02] hover:bg-white/[0.05]">
                  Sign into your account
                </button>
              </Link>
            </div>

            <div className="fade-up-4 flex flex-wrap items-center justify-center xl:justify-start gap-5 text-sm text-white/25">
              {["Free to start", "No credit card required", "6 modules included"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400/60" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Dashboard */}
          <div className="flex-1 w-full xl:max-w-none max-w-2xl">
            <HeroDashboard />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#060810] to-transparent pointer-events-none" />
    </section>
  );
}

/* ─── Stats ───────────────────────────────────────────────────── */
function StatsBar() {
  return (
    <section className="relative bg-[#060810] py-16 border-y border-white/[0.05]">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {STATS.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ────────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section id="features" className="bg-[#060810] py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/40 mb-4">
            <Zap className="h-3 w-3 text-primary" /> Everything in one system
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            Six modules.<br />
            <span className="text-white/30">One dashboard.</span>
          </h2>
          <p className="text-white/35 text-lg max-w-xl mx-auto leading-relaxed">
            Every tool a serious trader needs — built to work together, not fight each other.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] p-6 transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-0.5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
              <div className={`h-10 w-10 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-4`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/35 leading-relaxed mb-4">{f.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {f.tags.map((tag) => (
                  <span key={tag} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-white/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Module Showcase ─────────────────────────────────────────── */
function ModulesSection() {
  return (
    <section id="modules" className="bg-[#04060c] py-24 md:py-32 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-28">
        {MODULES.map((mod, i) => (
          <div
            key={mod.badge}
            className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-20`}
          >
            {/* Content */}
            <div className="flex-1 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-white/35 tracking-widest mb-5">
                <mod.icon className={`h-3 w-3 ${mod.color}`} />
                {mod.badge}
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-[1.15] mb-4">
                {mod.headline}
              </h2>
              <p className="text-white/40 leading-relaxed mb-6">{mod.desc}</p>
              <ul className="space-y-2.5 mb-8">
                {mod.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-white/50">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${mod.color}`} />
                    {b}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up">
                <button className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
                  Try {mod.badge.split(" ")[0].charAt(0) + mod.badge.slice(1).toLowerCase().split(" ")[0].slice(0)} now
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
            </div>

            {/* Mockup */}
            <div className="flex-1 w-full max-w-xl">
              {mod.mockup}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Testimonials ────────────────────────────────────────────── */
function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-[#060810] py-24 md:py-32 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
            Traders who switched,<br />
            <span className="text-white/30">never looked back.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-white/55 text-sm leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/70">{t.name}</div>
                  <div className="text-xs text-white/25">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section className="bg-[#04060c] py-24 md:py-32 border-t border-white/[0.04]">
      <div className="max-w-4xl mx-auto px-6 md:px-10 text-center relative">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-64 bg-primary/8 blur-[80px] rounded-full pointer-events-none glow-blob" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/40 mb-6">
            <Shield className="h-3 w-3 text-green-400" /> No credit card required
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1] mb-5">
            Your edge starts<br />
            <span
              className="animated-gradient bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), #f59e0b, #f97316)" }}
            >
              today.
            </span>
          </h2>
          <p className="text-white/35 text-lg max-w-lg mx-auto leading-relaxed mb-10">
            Join thousands of traders who use BlazeOS to stay organized, stay profitable, and stop leaving money on the table.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <button className="group h-13 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_60px_rgba(255,128,0,0.3)] hover:shadow-[0_0_80px_rgba(255,128,0,0.45)]">
                Initialize Your System
                <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="h-13 px-8 py-3.5 rounded-xl border border-white/[0.1] hover:border-white/20 text-white/50 hover:text-white text-base transition-all bg-transparent hover:bg-white/[0.03]">
                Already a member
              </button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-white/20">
            {[
              { icon: Globe,  label: "Available worldwide"     },
              { icon: Lock,   label: "End-to-end encrypted"    },
              { icon: Shield, label: "Bank-grade security"     },
              { icon: Zap,    label: "Sub-100ms response times" },
            ].map((b) => (
              <span key={b.label} className="flex items-center gap-1.5">
                <b.icon className="h-3.5 w-3.5 text-white/15" /> {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#04060c] border-t border-white/[0.05] py-10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Flame className="h-3 w-3 text-primary" />
          </div>
          <span className="text-sm font-bold text-white/40 tracking-tight">BlazeOS</span>
          <span className="text-white/15 text-sm mx-2">—</span>
          <span className="text-xs text-white/20">Your Trading & Business Operating System</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-white/20">
          {["Privacy Policy", "Terms of Service", "Support"].map((l) => (
            <a key={l} href="#" className="hover:text-white/40 transition-colors">{l}</a>
          ))}
        </div>
        <p className="text-xs text-white/15">© {new Date().getFullYear()} BlazeOS. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ─── Landing ─────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <>
      <style>{STYLES}</style>
      <div className="bg-[#060810] text-white selection:bg-primary/30">
        <Nav />
        <Hero />
        <StatsBar />
        <FeaturesSection />
        <ModulesSection />
        <TestimonialsSection />
        <CtaSection />
        <Footer />
      </div>
    </>
  );
}
