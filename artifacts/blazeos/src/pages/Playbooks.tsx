import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Playbook {
  id: number;
  name: string;
  description: string;
  rules: string;
  minRR: number | null;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number | null;
  createdAt: string;
}

interface PlaybookForm {
  name: string;
  description: string;
  rules: string;
  minRR?: number;
}

const EMPTY_FORM: PlaybookForm = { name: "", description: "", rules: "", minRR: 2 };

export default function Playbooks() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPlaybook, setEditPlaybook] = useState<Playbook | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState<PlaybookForm>({ ...EMPTY_FORM });
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  async function fetchPlaybooks() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/playbooks");
      const data = await res.json();
      setPlaybooks(data);
    } finally {
      setIsLoading(false);
    }
  }

  useState(() => { fetchPlaybooks(); });

  function openCreate() { setEditPlaybook(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }
  function openEdit(p: Playbook) {
    setEditPlaybook(p);
    setForm({ name: p.name, description: p.description, rules: p.rules, minRR: p.minRR ?? undefined });
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.description || !form.rules) return;
    setIsPending(true);
    try {
      const url = editPlaybook ? `/api/playbooks/${editPlaybook.id}` : "/api/playbooks";
      const method = editPlaybook ? "PATCH" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      await fetchPlaybooks();
      setShowForm(false);
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this playbook?")) return;
    await fetch(`/api/playbooks/${id}`, { method: "DELETE" });
    await fetchPlaybooks();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Playbooks</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Define and track your setups</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5 min-h-[44px] px-4">
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/20 rounded-xl animate-pulse" />)}</div>
      ) : playbooks.length === 0 ? (
        <Card className="border-border/40 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm text-center">No playbooks yet. Build your first trading setup.</p>
            <Button onClick={openCreate} variant="outline" size="sm" className="min-h-[44px]">Create Playbook</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {playbooks.map((pb) => (
            <Card key={pb.id} className="border-border/40">
              <button className="w-full text-left" onClick={() => setExpanded(expanded === pb.id ? null : pb.id)}>
                <CardHeader className="pb-0 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0 text-muted-foreground">
                        {expanded === pb.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm leading-tight truncate">{pb.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{pb.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(pb.totalTrades ?? 0) > 0 && (
                        <span className={cn("text-sm font-bold font-mono", (pb.winRate ?? 0) >= 50 ? "text-green-400" : "text-red-400")}>
                          {(pb.winRate ?? 0).toFixed(0)}%
                        </span>
                      )}
                      {pb.minRR && <Badge variant="outline" className="text-xs border-primary/40 text-primary">{pb.minRR}R</Badge>}
                    </div>
                  </div>
                </CardHeader>
              </button>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  {(pb.totalTrades ?? 0) > 0
                    ? `${pb.totalTrades} trades · ${pb.wins}W / ${pb.losses}L`
                    : "No trades yet"}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(pb); }}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 min-h-[40px] min-w-[40px] flex items-center justify-center">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(pb.id); }}
                    className="p-2 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-500/10 min-h-[40px] min-w-[40px] flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {expanded === pb.id && (
                <CardContent className="px-4 pb-4 pt-0 border-t border-border/20">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">Rules</div>
                  <div className="space-y-2">
                    {pb.rules.split("\n").filter(Boolean).map((rule, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <span className="leading-relaxed">{rule}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto bg-card border-border/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editPlaybook ? "Edit Playbook" : "New Playbook"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Setup Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-muted/30 border-border/40 min-h-[48px]" placeholder="London Sweep Reversal" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-muted/30 border-border/40 min-h-[48px]" placeholder="Brief description" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Minimum R:R</Label>
              <Input type="number" step="0.1" value={form.minRR ?? ""} onChange={(e) => setForm((f) => ({ ...f, minRR: parseFloat(e.target.value) || undefined }))} className="bg-muted/30 border-border/40 font-mono min-h-[48px]" placeholder="2.0" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Rules (one per line)</Label>
              <Textarea value={form.rules} onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))} className="bg-muted/30 border-border/40 resize-none font-mono text-xs" rows={6}
                placeholder={"Wait for sweep of Asian high/low\nConfirm MSS on M15\nEntry on FVG retest"} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" className="flex-1 min-h-[48px]" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button className="flex-1 min-h-[48px]" onClick={handleSubmit} disabled={isPending}>
              {editPlaybook ? "Update" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
