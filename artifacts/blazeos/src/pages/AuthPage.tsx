import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Flame, TrendingUp, Bot, BookOpen, Users, DollarSign,
  Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Loader2,
  BarChart2, Activity, Shield,
} from "lucide-react";

type AuthView = "sign-in" | "sign-up" | "forgot-password";

export interface AuthPageProps {
  initialView?: AuthView;
}

/* ─── Constants ──────────────────────────────────────────────── */

const TICKER_ITEMS = [
  { symbol: "XAUUSD",  price: "2,341.50",  change: "+0.34%",  up: true  },
  { symbol: "NAS100",  price: "18,245.30", change: "+1.23%",  up: true  },
  { symbol: "BTCUSD",  price: "67,432.10", change: "+2.15%",  up: true  },
  { symbol: "EURUSD",  price: "1.0856",    change: "-0.12%",  up: false },
  { symbol: "USDJPY",  price: "155.43",    change: "+0.45%",  up: true  },
  { symbol: "SPX500",  price: "5,234.18",  change: "+0.78%",  up: true  },
  { symbol: "UKOIL",   price: "82.34",     change: "+1.56%",  up: true  },
  { symbol: "DXY",     price: "104.23",    change: "-0.23%",  up: false },
  { symbol: "GBPUSD",  price: "1.2645",    change: "+0.09%",  up: true  },
  { symbol: "ETHBTC",  price: "0.0512",    change: "-0.31%",  up: false },
];

const FEATURES = [
  { icon: TrendingUp, label: "Trading Hub",          desc: "Log trades, analyze setups, and track P&L" },
  { icon: Bot,        label: "AI Command Center",    desc: "GPT-4, Claude & Perplexity for your edge" },
  { icon: BookOpen,   label: "Knowledge Vault",      desc: "Playbooks, strategies, and trade notes" },
  { icon: Users,      label: "CRM",                  desc: "Manage clients, track deals, build pipelines" },
  { icon: DollarSign, label: "Finance Dashboard",    desc: "Income, expenses, and business cashflow" },
];

const MOCK_BARS = [30, 52, 45, 70, 48, 88, 62, 77, 55, 92, 68, 82];

const MOCK_TRADES = [
  { symbol: "XAUUSD", dir: "LONG",  result: "+$420.00", pct: "+2.1%",  win: true  },
  { symbol: "NAS100", dir: "SHORT", result: "-$110.00", pct: "-0.6%",  win: false },
  { symbol: "BTCUSD", dir: "LONG",  result: "+$830.00", pct: "+1.2%",  win: true  },
];

/* ─── Password strength ──────────────────────────────────────── */

function getStrength(pwd: string): { score: number; label: string; bars: string[] } {
  if (!pwd) return { score: 0, label: "", bars: [] };
  const bars = ["bg-white/10", "bg-white/10", "bg-white/10", "bg-white/10"];
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNum   = /[0-9]/.test(pwd);
  const hasSpec  = /[^a-zA-Z0-9]/.test(pwd);
  const score =
    pwd.length < 6 ? 1
    : pwd.length < 8 ? 2
    : hasUpper && hasNum && hasSpec ? 4
    : hasNum || hasSpec ? 3
    : 2;
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-green-500"];
  const labels = ["", "Too short", "Weak", "Good", "Strong"];
  for (let i = 0; i < score; i++) bars[i] = colors[score];
  return { score, label: labels[score], bars };
}

/* ─── Animated Ticker ────────────────────────────────────────── */

function Ticker() {
  const all = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden border-t border-white/[0.06] bg-black/30 py-2.5">
      <div className="flex gap-0 ticker-track whitespace-nowrap">
        {all.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-5 text-xs font-mono border-r border-white/[0.06]">
            <span className="text-white/60 font-semibold tracking-wide">{item.symbol}</span>
            <span className="text-white/80">{item.price}</span>
            <span className={item.up ? "text-green-400" : "text-red-400"}>{item.change}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Mock Dashboard ─────────────────────────────────────────── */

function MockDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] rounded-xl border border-white/[0.08] bg-[#0a0c12]/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/60">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="h-2 w-2 rounded-full bg-red-500/60" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
        <div className="h-2 w-2 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[10px] font-mono text-white/20 tracking-widest">BLAZEOS — DASHBOARD</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "NET P&L",      value: "+$12,450", sub: "This month",   color: "text-green-400" },
            { label: "WIN RATE",     value: "68.4%",    sub: "Last 30 days", color: "text-primary"   },
            { label: "ACTIVE",       value: "3 Trades", sub: "Open now",     color: "text-white/80"  },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
              <div className="text-[9px] font-mono text-white/30 tracking-widest">{m.label}</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${m.color}`}>{m.value}</div>
              <div className="text-[9px] text-white/20 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono text-white/30 tracking-widest">P&L CHART — 12 WEEKS</span>
            <span className="text-[9px] font-mono text-green-400">+34.2%</span>
          </div>
          <div className="flex items-end gap-1 h-14">
            {MOCK_BARS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm opacity-80"
                style={{
                  height: `${h}%`,
                  background: i === MOCK_BARS.length - 1
                    ? "hsl(var(--primary))"
                    : `rgba(${i > 7 ? "74,222,128" : "99,102,241"},${0.3 + (h / 100) * 0.5})`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Recent trades */}
        <div className="space-y-1.5">
          {MOCK_TRADES.map((t, i) => (
            <div key={i} className="flex items-center justify-between rounded-md bg-white/[0.02] border border-white/[0.05] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white/70">{t.symbol}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm font-bold ${t.dir === "LONG" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{t.dir}</span>
              </div>
              <div className="text-right">
                <div className={`text-xs font-mono font-bold ${t.win ? "text-green-400" : "text-red-400"}`}>{t.result}</div>
                <div className={`text-[10px] font-mono ${t.win ? "text-green-400/60" : "text-red-400/60"}`}>{t.pct}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fade-out overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#060810] to-transparent pointer-events-none" />
    </div>
  );
}

/* ─── Left Panel ─────────────────────────────────────────────── */

function LeftPanel() {
  return (
    <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Gradient blobs */}
      <div className="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-80 h-80 rounded-full bg-primary/[0.06] blur-[80px] pointer-events-none" />

      <div className="relative flex-1 flex flex-col px-12 pt-10 pb-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-12">
          <div className="h-9 w-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">BlazeOS</span>
          <span className="ml-1 text-[10px] font-mono text-white/20 tracking-widest border border-white/10 rounded px-1.5 py-0.5">v2.0</span>
        </div>

        {/* Headline */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white leading-[1.15] tracking-tight mb-3">
            Your Trading &<br />
            <span className="text-primary">Business Operating</span><br />
            System
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-sm">
            Analyze markets, manage clients, track performance, and build your knowledge base from a single dashboard.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className="flex items-center gap-3 feature-item"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <f.icon className="h-3.5 w-3.5 text-primary/70" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white/70">{f.label}</span>
                <span className="text-white/25 mx-2 text-xs">—</span>
                <span className="text-xs text-white/30">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { icon: Shield,   label: "Bank-grade security" },
            { icon: Activity, label: "99.9% uptime" },
            { icon: BarChart2, label: "Real-time data" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 text-[10px] font-mono text-white/25">
              <b.icon className="h-3 w-3" />
              {b.label}
            </div>
          ))}
        </div>

        {/* Dashboard Mockup */}
        <div className="flex-1 min-h-0 flex flex-col justify-end pb-0">
          <MockDashboard />
        </div>
      </div>

      {/* Ticker */}
      <Ticker />
    </div>
  );
}

/* ─── Input field wrapper ────────────────────────────────────── */

function Field({
  id, label, type = "text", value, onChange, placeholder, required, autoComplete, extra,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  extra?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium text-white/50 tracking-wide uppercase">{label}</Label>
        {extra}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 pr-10 font-mono text-sm"
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Sign In Form ───────────────────────────────────────────── */

function GoogleButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white/70 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2.5"
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
  );
}

function OAuthDivider() {
  return (
    <div className="relative flex items-center gap-3">
      <div className="flex-1 h-px bg-white/[0.08]" />
      <span className="text-[11px] font-mono text-white/20 tracking-widest">OR</span>
      <div className="flex-1 h-px bg-white/[0.08]" />
    </div>
  );
}

function SignInForm({ onForgot, onSwitch }: { onForgot: () => void; onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <Field id="si-email" label="Email address" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" required autoComplete="email" />
      <Field id="si-password" label="Password" type="password" value={password} onChange={setPassword}
        placeholder="••••••••" required autoComplete="current-password"
        extra={
          <button type="button" onClick={onForgot} className="text-[11px] text-primary/70 hover:text-primary transition-colors">
            Forgot password?
          </button>
        }
      />

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating…</> : "Sign In"}
      </button>

      <OAuthDivider />
      <GoogleButton loading={loading} onClick={handleGoogle} />

      <p className="text-center text-sm text-white/30">
        No account?{" "}
        <button type="button" onClick={onSwitch} className="text-primary/80 hover:text-primary font-medium transition-colors">
          Create one free
        </button>
      </p>
    </form>
  );
}

/* ─── Sign Up Form ───────────────────────────────────────────── */

function SignUpForm({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: (email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const strength = getStrength(password);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    if (error) { setError(error.message); setLoading(false); }
    else { onSuccess(email); }
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <Field id="su-name" label="Full name" value={name} onChange={setName}
        placeholder="John Doe" autoComplete="name" />
      <Field id="su-email" label="Email address" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" required autoComplete="email" />
      <div className="space-y-2">
        <Field id="su-password" label="Password" type="password" value={password} onChange={setPassword}
          placeholder="Min. 8 characters" required autoComplete="new-password" />
        {password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {strength.bars.map((c, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${c}`} />
              ))}
            </div>
            {strength.label && (
              <p className={`text-[11px] font-mono ${strength.score >= 4 ? "text-green-400" : strength.score === 3 ? "text-yellow-400" : "text-red-400"}`}>
                {strength.label}
              </p>
            )}
          </div>
        )}
      </div>
      <Field id="su-confirm" label="Confirm password" type="password" value={confirm} onChange={setConfirm}
        placeholder="••••••••" required autoComplete="new-password" />

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password || !confirm}
        className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create Account"}
      </button>

      <OAuthDivider />
      <GoogleButton loading={loading} onClick={async () => {
        setError(null);
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) { setError(error.message); setLoading(false); }
      }} />

      <p className="text-center text-xs text-white/20 leading-relaxed">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>

      <p className="text-center text-sm text-white/30">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-primary/80 hover:text-primary font-medium transition-colors">
          Sign in
        </button>
      </p>
    </form>
  );
}

/* ─── Forgot Password Form ───────────────────────────────────── */

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setError(error.message); setLoading(false); }
    else { setSent(true); setLoading(false); }
  };

  if (sent) {
    return (
      <div className="text-center space-y-5 py-4">
        <div className="h-14 w-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-green-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold mb-1.5">Check your inbox</h3>
          <p className="text-white/40 text-sm leading-relaxed">
            We sent a password reset link to{" "}
            <span className="text-white/60 font-medium">{email}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-primary/80 hover:text-primary font-medium transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="text-center space-y-2 pb-2">
        <p className="text-white/40 text-sm leading-relaxed">
          Enter the email associated with your account and we'll send a reset link.
        </p>
      </div>

      <Field id="fp-email" label="Email address" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" required autoComplete="email" />

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold text-sm transition-all flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send Reset Link"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-white/30 hover:text-white/60 transition-colors inline-flex items-center justify-center gap-1.5 py-1"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </button>
    </form>
  );
}

/* ─── Sign Up Success ────────────────────────────────────────── */

function SignUpSuccess({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="text-center space-y-5 py-4">
      <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="text-white font-semibold mb-1.5">Verify your email</h3>
        <p className="text-white/40 text-sm leading-relaxed">
          We sent a confirmation link to{" "}
          <span className="text-white/60 font-medium">{email}</span>.
          <br />Click it to activate your account.
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-primary/80 hover:text-primary font-medium transition-colors inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </button>
    </div>
  );
}

/* ─── Right Panel ────────────────────────────────────────────── */

type Tab = "sign-in" | "sign-up";

function RightPanel({ initialView }: { initialView: AuthView }) {
  const [tab, setTab] = useState<Tab>(
    initialView === "sign-up" ? "sign-up" : "sign-in",
  );
  const [subView, setSubView] = useState<"form" | "forgot" | "success">(
    initialView === "forgot-password" ? "forgot" : "form",
  );
  const [successEmail, setSuccessEmail] = useState("");

  const handleForgot  = () => setSubView("forgot");
  const handleBack    = () => { setSubView("form"); setTab("sign-in"); };
  const handleSuccess = (email: string) => { setSuccessEmail(email); setSubView("success"); };
  const handleSwitch  = (to: Tab) => { setTab(to); setSubView("form"); };

  const titles: Record<string, string> = {
    "form-sign-in":  "Access System",
    "form-sign-up":  "Initialize Account",
    "forgot":        "Reset Password",
    "success":       "Account Created",
  };
  const titleKey = subView !== "form" ? subView : `form-${tab}`;

  return (
    <div className="w-full lg:w-[480px] flex flex-col items-center justify-center p-6 lg:p-10 min-h-[100dvh] lg:min-h-auto lg:border-l border-white/[0.04]">
      {/* Mobile logo */}
      <div className="flex lg:hidden items-center gap-2 mb-8 self-start">
        <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Flame className="h-4 w-4 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">BlazeOS</span>
      </div>

      <div className="w-full max-w-[400px]">
        {/* Glass card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          <div className="p-7 pb-5">
            {/* Tab switcher — only shown when not in forgot/success */}
            {subView === "form" && (
              <div className="flex bg-white/[0.04] rounded-lg p-1 mb-6 border border-white/[0.06]">
                {(["sign-in", "sign-up"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSwitch(t)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                      tab === t
                        ? "bg-white/[0.08] text-white shadow-sm"
                        : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    {t === "sign-in" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>
            )}

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">{titles[titleKey]}</h2>
              {subView === "form" && tab === "sign-in" && (
                <p className="text-white/30 text-sm mt-1">Enter your credentials to continue</p>
              )}
              {subView === "form" && tab === "sign-up" && (
                <p className="text-white/30 text-sm mt-1">Create your institutional profile</p>
              )}
            </div>

            {/* Form content */}
            {subView === "form" && tab === "sign-in" && (
              <SignInForm onForgot={handleForgot} onSwitch={() => handleSwitch("sign-up")} />
            )}
            {subView === "form" && tab === "sign-up" && (
              <SignUpForm onSwitch={() => handleSwitch("sign-in")} onSuccess={handleSuccess} />
            )}
            {subView === "forgot" && (
              <ForgotPasswordForm onBack={handleBack} />
            )}
            {subView === "success" && (
              <SignUpSuccess email={successEmail} onBack={handleBack} />
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/15 mt-6 font-mono">
          © {new Date().getFullYear()} BlazeOS. All rights reserved.
        </p>
      </div>
    </div>
  );
}

/* ─── AuthPage ───────────────────────────────────────────────── */

export default function AuthPage({ initialView = "sign-in" }: AuthPageProps) {
  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 40s linear infinite;
          display: inline-flex;
        }
        @keyframes feature-fade-in {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .feature-item {
          animation: feature-fade-in 0.4s ease both;
        }
      `}</style>

      <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#060810] text-foreground">
        <LeftPanel />
        <RightPanel initialView={initialView} />
      </div>
    </>
  );
}
