import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, CheckCircle2, Plus, Trash2, Edit2, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const FIRMS = ["FTMO", "FundedNext", "GOAT Funded", "Maven Trading", "Alpha Capital", "The 5%ers", "Funded Engineer", "Personal"];

interface Account {
  id: number;
  name: string;
  firm: string;
  accountSize: number;
  currentBalance: number;
  dailyDrawdownLimit: number;
  maxDrawdownLimit: number;
  profitTarget: number;
  trailingDrawdown: boolean;
  status: "ACTIVE" | "PASSED" | "FAILED" | "FUNDED";
  notes: string | null;
  createdAt: string;
}

interface AccountForm {
  name: string;
  firm: string;
  accountSize: number;
  currentBalance: number;
  dailyDrawdownLimit: number;
  maxDrawdownLimit: number;
  profitTarget: number;
  trailingDrawdown: boolean;
  status: Account["status"];
}

const EMPTY_FORM: AccountForm = {
  name: "", firm: "FTMO", accountSize: 100000, currentBalance: 100000,
  dailyDrawdownLimit: 5, maxDrawdownLimit: 10, profitTarget: 10, trailingDrawdown: false, status: "ACTIVE",
};

export default function PropFirmTracker() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountForm>({ ...EMPTY_FORM });
  const [isPending, setIsPending] = useState(false);

  async function fetchAccounts() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accounts");
      setAccounts(await res.json());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchAccounts(); }, []);

  function openCreate() { setEditAccount(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }
  function openEdit(a: Account) {
    setEditAccount(a);
    setForm({ name: a.name, firm: a.firm, accountSize: a.accountSize, currentBalance: a.currentBalance, dailyDrawdownLimit: a.dailyDrawdownLimit, maxDrawdownLimit: a.maxDrawdownLimit, profitTarget: a.profitTarget, trailingDrawdown: a.trailingDrawdown, status: a.status });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.firm) return;
    setIsPending(true);
    try {
      const url = editAccount ? `/api/accounts/${editAccount.id}` : "/api/accounts";
      const method = editAccount ? "PATCH" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      await fetchAccounts();
      setShowForm(false);
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this account?")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    await fetchAccounts();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Prop Firms</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Monitor funded accounts & challenges</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5 min-h-[44px] px-4">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-48 bg-muted/20 rounded-xl animate-pulse" />)}</div>
      ) : accounts.length === 0 ? (
        <Card className="border-border/40 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Briefcase className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm text-center">No accounts yet. Add your first prop firm account.</p>
            <Button onClick={openCreate} variant="outline" size="sm" className="min-h-[44px]">Add Account</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} onEdit={() => openEdit(account)} onDelete={() => handleDelete(account.id)} />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto bg-card border-border/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editAccount ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Account Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-muted/30 border-border/40 min-h-[48px]" placeholder="FTMO Challenge #1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Firm</Label>
              <Select value={form.firm} onValueChange={(v) => setForm((f) => ({ ...f, firm: v }))}>
                <SelectTrigger className="bg-muted/30 border-border/40 min-h-[48px]"><SelectValue /></SelectTrigger>
                <SelectContent>{FIRMS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as AccountForm["status"] }))}>
                <SelectTrigger className="bg-muted/30 border-border/40 min-h-[48px]"><SelectValue /></SelectTrigger>
                <SelectContent>{(["ACTIVE", "PASSED", "FAILED", "FUNDED"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Account Size ($)</Label>
              <Input type="number" value={form.accountSize} onChange={(e) => setForm((f) => ({ ...f, accountSize: parseFloat(e.target.value) }))} className="bg-muted/30 border-border/40 font-mono min-h-[48px]" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Current Balance ($)</Label>
              <Input type="number" value={form.currentBalance} onChange={(e) => setForm((f) => ({ ...f, currentBalance: parseFloat(e.target.value) }))} className="bg-muted/30 border-border/40 font-mono min-h-[48px]" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Daily DD %</Label>
              <Input type="number" value={form.dailyDrawdownLimit} onChange={(e) => setForm((f) => ({ ...f, dailyDrawdownLimit: parseFloat(e.target.value) }))} className="bg-muted/30 border-border/40 font-mono min-h-[48px]" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Max DD %</Label>
              <Input type="number" value={form.maxDrawdownLimit} onChange={(e) => setForm((f) => ({ ...f, maxDrawdownLimit: parseFloat(e.target.value) }))} className="bg-muted/30 border-border/40 font-mono min-h-[48px]" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Profit Target %</Label>
              <Input type="number" value={form.profitTarget} onChange={(e) => setForm((f) => ({ ...f, profitTarget: parseFloat(e.target.value) }))} className="bg-muted/30 border-border/40 font-mono min-h-[48px]" />
            </div>
            <div className="flex items-center gap-3 py-2 min-h-[48px]">
              <Switch checked={form.trailingDrawdown} onCheckedChange={(v) => setForm((f) => ({ ...f, trailingDrawdown: v }))} />
              <Label className="text-sm">Trailing Drawdown</Label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" className="flex-1 min-h-[48px]" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button className="flex-1 min-h-[48px]" onClick={handleSubmit} disabled={isPending}>
              {editAccount ? "Update" : "Add Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountCard({ account, onEdit, onDelete }: { account: Account; onEdit: () => void; onDelete: () => void }) {
  const pnlPct = ((account.currentBalance - account.accountSize) / account.accountSize) * 100;
  const profitProgress = account.profitTarget > 0 ? Math.min(100, (pnlPct / account.profitTarget) * 100) : 0;
  const maxDDUsed = Math.max(0, ((account.accountSize - account.currentBalance) / account.accountSize) * 100);
  const nearMaxLimit = maxDDUsed >= account.maxDrawdownLimit * 0.8;

  const statusColor: Record<string, string> = {
    ACTIVE: "border-primary/40 text-primary",
    FUNDED: "border-green-500/40 text-green-400",
    PASSED: "border-blue-500/40 text-blue-400",
    FAILED: "border-red-500/40 text-red-400",
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-base">{account.name}</div>
            <div className="text-xs text-muted-foreground">{account.firm}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={cn("text-xs", statusColor[account.status] ?? "")}>{account.status}</Badge>
            <button onClick={onEdit} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 min-h-[36px] min-w-[36px] flex items-center justify-center">
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-500/10 min-h-[36px] min-w-[36px] flex items-center justify-center">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {nearMaxLimit && (
          <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Approaching max drawdown limit
          </div>
        )}
        {account.status === "FUNDED" && (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Funded — real capital
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/20 rounded-lg p-2.5">
            <div className="text-[10px] text-muted-foreground mb-0.5">Balance</div>
            <div className="font-mono font-bold text-sm">${(account.currentBalance / 1000).toFixed(1)}k</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-2.5">
            <div className="text-[10px] text-muted-foreground mb-0.5">P&L</div>
            <div className={cn("font-mono font-bold text-sm", pnlPct >= 0 ? "text-green-400" : "text-red-400")}>
              {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
            </div>
          </div>
          <div className="bg-muted/20 rounded-lg p-2.5">
            <div className="text-[10px] text-muted-foreground mb-0.5">Size</div>
            <div className="font-mono font-bold text-sm">${(account.accountSize / 1000).toFixed(0)}k</div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Profit Target</span>
              <span className={cn(profitProgress >= 100 ? "text-green-400" : "text-foreground")}>{pnlPct.toFixed(2)}% / {account.profitTarget}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, profitProgress))}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Max DD Used</span>
              <span className={cn(nearMaxLimit ? "text-red-400" : "text-foreground")}>{maxDDUsed.toFixed(2)}% / {account.maxDrawdownLimit}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", nearMaxLimit ? "bg-red-500" : "bg-yellow-500")} style={{ width: `${Math.min(100, (maxDDUsed / account.maxDrawdownLimit) * 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/20">
          <span>DD {account.dailyDrawdownLimit}%/day</span>
          <span>Max {account.maxDrawdownLimit}%</span>
          {account.trailingDrawdown && <span className="text-yellow-400">Trailing</span>}
        </div>
      </CardContent>
    </Card>
  );
}
