import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Shield, Plus, AlertTriangle, CheckCircle2, XCircle,
  TrendingUp, DollarSign, Target, Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PropFirm = "FTMO" | "FundedNext" | "Goat Funded" | "Custom";

type Account = {
  id: string;
  name: string;
  firm: PropFirm;
  accountSize: number;
  startEquity: number;
  currentEquity: number;
  maxDrawdown: number;
  dailyDrawdown: number;
  profitTarget: number;
  phase: string;
  status: "active" | "passed" | "breached";
};

const FIRM_PRESETS: Record<PropFirm, { maxDD: number; dailyDD: number; target: number }> = {
  FTMO: { maxDD: 10, dailyDD: 5, target: 10 },
  FundedNext: { maxDD: 10, dailyDD: 5, target: 8 },
  "Goat Funded": { maxDD: 8, dailyDD: 4, target: 10 },
  Custom: { maxDD: 10, dailyDD: 5, target: 10 },
};

function ProgressBar({ value, max, color, danger }: {
  value: number; max: number; color: string; danger?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-white/5 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${danger && pct > 70 ? "bg-red-500 animate-pulse" : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function PropFirmTracker() {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: "1",
      name: "FTMO Challenge — $100K",
      firm: "FTMO",
      accountSize: 100000,
      startEquity: 100000,
      currentEquity: 104200,
      maxDrawdown: 10,
      dailyDrawdown: 5,
      profitTarget: 10,
      phase: "Phase 1",
      status: "active",
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    firm: "FTMO" as PropFirm,
    accountSize: 100000,
    currentEquity: 100000,
    maxDrawdown: 10,
    dailyDrawdown: 5,
    profitTarget: 10,
    phase: "Phase 1",
  });

  const handleFirmChange = (f: PropFirm) => {
    const preset = FIRM_PRESETS[f];
    setForm((prev) => ({ ...prev, firm: f, ...preset }));
  };

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast({ title: "Enter an account name.", variant: "destructive" });
      return;
    }
    const acct: Account = {
      id: crypto.randomUUID(),
      ...form,
      startEquity: form.accountSize,
      status: "active",
    };
    setAccounts((prev) => [acct, ...prev]);
    setIsOpen(false);
    setForm({ name: "", firm: "FTMO", accountSize: 100000, currentEquity: 100000, maxDrawdown: 10, dailyDrawdown: 5, profitTarget: 10, phase: "Phase 1" });
    toast({ title: "Account added." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prop Firm Tracker</h1>
            <p className="text-xs text-white/30 font-mono mt-0.5">
              Monitor challenges, funded accounts, and drawdown limits
            </p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d0d14] border-white/[0.08] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-mono tracking-widest uppercase text-white/60">
                New Prop Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/40 uppercase tracking-widest">Account Name</Label>
                <Input
                  placeholder="e.g. FTMO Challenge $100K"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-background border-white/[0.08] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/40 uppercase tracking-widest">Prop Firm</Label>
                  <Select value={form.firm} onValueChange={(v) => handleFirmChange(v as PropFirm)}>
                    <SelectTrigger className="bg-background border-white/[0.08] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["FTMO", "FundedNext", "Goat Funded", "Custom"] as PropFirm[]).map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/40 uppercase tracking-widest">Phase</Label>
                  <Select value={form.phase} onValueChange={(v) => setForm((f) => ({ ...f, phase: v }))}>
                    <SelectTrigger className="bg-background border-white/[0.08] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Phase 1">Phase 1</SelectItem>
                      <SelectItem value="Phase 2">Phase 2</SelectItem>
                      <SelectItem value="Funded">Funded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/40 uppercase tracking-widest">Account Size ($)</Label>
                  <Input type="number" value={form.accountSize} onChange={(e) => setForm((f) => ({ ...f, accountSize: Number(e.target.value) }))} className="bg-background border-white/[0.08] text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/40 uppercase tracking-widest">Current Equity ($)</Label>
                  <Input type="number" value={form.currentEquity} onChange={(e) => setForm((f) => ({ ...f, currentEquity: Number(e.target.value) }))} className="bg-background border-white/[0.08] text-sm font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/40 uppercase tracking-widest">Max DD %</Label>
                  <Input type="number" step="0.1" value={form.maxDrawdown} onChange={(e) => setForm((f) => ({ ...f, maxDrawdown: Number(e.target.value) }))} className="bg-background border-white/[0.08] text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/40 uppercase tracking-widest">Daily DD %</Label>
                  <Input type="number" step="0.1" value={form.dailyDrawdown} onChange={(e) => setForm((f) => ({ ...f, dailyDrawdown: Number(e.target.value) }))} className="bg-background border-white/[0.08] text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/40 uppercase tracking-widest">Target %</Label>
                  <Input type="number" step="0.1" value={form.profitTarget} onChange={(e) => setForm((f) => ({ ...f, profitTarget: Number(e.target.value) }))} className="bg-background border-white/[0.08] text-sm font-mono" />
                </div>
              </div>
              <Button className="w-full" onClick={handleAdd}>Add Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shield className="h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/30 text-sm">No prop accounts tracked yet.</p>
          <p className="text-white/20 text-xs mt-1">Add your FTMO, FundedNext, or custom prop firm account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accounts.map((acct) => {
            const pnl = acct.currentEquity - acct.startEquity;
            const pnlPct = ((pnl / acct.startEquity) * 100);
            const targetAmount = acct.startEquity * (acct.profitTarget / 100);
            const maxDDAmount = acct.startEquity * (acct.maxDrawdown / 100);
            const dailyDDAmount = acct.startEquity * (acct.dailyDrawdown / 100);
            const drawdownFromPeak = acct.startEquity - acct.currentEquity;
            const drawdownPct = Math.max(0, (drawdownFromPeak / acct.startEquity) * 100);
            const targetProgress = Math.max(0, Math.min(100, (pnl / targetAmount) * 100));
            const ddProgress = Math.max(0, Math.min(100, (drawdownPct / acct.maxDrawdown) * 100));
            const isPayoutEligible = pnlPct >= acct.profitTarget && drawdownPct < acct.maxDrawdown;
            const isDDWarning = drawdownPct >= acct.maxDrawdown * 0.7;
            const isBreached = drawdownPct >= acct.maxDrawdown;

            return (
              <Card key={acct.id} className={`bg-[#0d0d14] border ${isBreached ? "border-red-500/40" : isDDWarning ? "border-orange-500/30" : isPayoutEligible ? "border-green-500/30" : "border-white/[0.06]"} transition-colors`}>
                <CardContent className="p-5 space-y-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white/90">{acct.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{acct.firm}</Badge>
                        <Badge className="text-[10px] bg-white/5 text-white/40 border-white/10">{acct.phase}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBreached ? (
                        <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Breached
                        </Badge>
                      ) : isPayoutEligible ? (
                        <Badge className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Payout Eligible
                        </Badge>
                      ) : isDDWarning ? (
                        <Badge className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/20 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          DD Warning
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">Active</Badge>
                      )}
                      <button
                        onClick={() => setAccounts((prev) => prev.filter((a) => a.id !== acct.id))}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Equity summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] text-center">
                      <div className="text-[10px] text-white/25 font-mono uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                        <DollarSign className="h-3 w-3" /> Account
                      </div>
                      <div className="font-mono font-bold text-sm text-white/70">
                        ${acct.accountSize.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] text-center">
                      <div className="text-[10px] text-white/25 font-mono uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Equity
                      </div>
                      <div className="font-mono font-bold text-sm text-white/70">
                        ${acct.currentEquity.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] text-center">
                      <div className="text-[10px] text-white/25 font-mono uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                        <Target className="h-3 w-3" /> P&L
                      </div>
                      <div className={`font-mono font-bold text-sm ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40 font-mono">Profit Target ({acct.profitTarget}%)</span>
                        <span className={`font-mono font-bold ${pnlPct >= acct.profitTarget ? "text-green-400" : "text-white/50"}`}>
                          {pnlPct.toFixed(2)}% / {acct.profitTarget}%
                        </span>
                      </div>
                      <ProgressBar value={targetProgress} max={100} color="bg-green-500" />
                      <div className="text-[10px] text-white/25 font-mono">
                        ${Math.max(0, pnl).toFixed(2)} / ${targetAmount.toFixed(2)} target
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40 font-mono">Max Drawdown ({acct.maxDrawdown}%)</span>
                        <span className={`font-mono font-bold ${isBreached ? "text-red-400" : isDDWarning ? "text-orange-400" : "text-white/50"}`}>
                          {drawdownPct.toFixed(2)}% / {acct.maxDrawdown}%
                        </span>
                      </div>
                      <ProgressBar value={ddProgress} max={100} color="bg-orange-400" danger />
                      <div className="text-[10px] text-white/25 font-mono">
                        Remaining buffer: ${Math.max(0, maxDDAmount - drawdownFromPeak).toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40 font-mono">Daily DD Limit ({acct.dailyDrawdown}%)</span>
                        <span className="font-mono text-white/40">${dailyDDAmount.toFixed(2)} max loss/day</span>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-orange-400/60" />
                        <span className="text-[11px] text-white/30 font-mono">
                          Stop trading if daily loss exceeds ${dailyDDAmount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rule violations / warnings */}
                  {isBreached && (
                    <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-red-400 font-bold">Rule Violation — Max Drawdown Breached</p>
                        <p className="text-[11px] text-red-400/60 mt-0.5 font-mono">This account has exceeded the maximum drawdown limit. Contact your prop firm.</p>
                      </div>
                    </div>
                  )}
                  {!isBreached && isDDWarning && (
                    <div className="p-3 rounded-md bg-orange-500/10 border border-orange-500/30 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-orange-400 font-bold">Drawdown Warning — Approaching Limit</p>
                        <p className="text-[11px] text-orange-400/60 mt-0.5 font-mono">You have used over 70% of your max drawdown. Reduce risk immediately.</p>
                      </div>
                    </div>
                  )}
                  {isPayoutEligible && !isBreached && (
                    <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-green-400 font-bold">Profit Target Reached — Payout Eligible</p>
                        <p className="text-[11px] text-green-400/60 mt-0.5 font-mono">You have hit your profit target. Submit your payout request to your prop firm.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
