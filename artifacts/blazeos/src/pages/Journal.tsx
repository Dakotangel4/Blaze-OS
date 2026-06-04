import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NotebookPen, Plus, Brain, Target, AlertTriangle, BookOpen,
  Calendar, ChevronDown, CheckCircle2, XCircle, Minus,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type JournalView = "daily" | "weekly" | "monthly" | "psychology";

type DayEntry = {
  id: string;
  date: string;
  emotionalState: string;
  executionQuality: number;
  disciplineScore: number;
  notes: string;
  lessons: string;
  mistakes: string;
  view: "daily" | "weekly" | "monthly";
};

const EMOTIONAL_STATES = [
  { value: "calm", label: "Calm & Focused", color: "text-green-400 bg-green-400/10" },
  { value: "confident", label: "Confident", color: "text-blue-400 bg-blue-400/10" },
  { value: "anxious", label: "Anxious", color: "text-yellow-400 bg-yellow-400/10" },
  { value: "frustrated", label: "Frustrated", color: "text-orange-400 bg-orange-400/10" },
  { value: "fearful", label: "Fearful / FOMO", color: "text-red-400 bg-red-400/10" },
  { value: "revenge", label: "Revenge Mode", color: "text-red-500 bg-red-500/10" },
  { value: "neutral", label: "Neutral", color: "text-white/40 bg-white/5" },
];

function ScoreSlider({ label, value, onChange, color }: {
  label: string; value: number; onChange: (v: number) => void; color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-white/50 uppercase tracking-widest">{label}</Label>
        <span className={`text-sm font-bold font-mono ${color}`}>{value}/10</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-1.5"
      />
      <div className="flex justify-between text-[10px] text-white/20 font-mono">
        <span>Poor</span><span>Average</span><span>Elite</span>
      </div>
    </div>
  );
}

export default function Journal() {
  const [activeView, setActiveView] = useState<JournalView>("daily");
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    emotionalState: "calm",
    executionQuality: 7,
    disciplineScore: 7,
    notes: "",
    lessons: "",
    mistakes: "",
  });

  const handleSave = () => {
    if (!form.notes.trim()) {
      toast({ title: "Add some journal notes before saving.", variant: "destructive" });
      return;
    }
    const entry: DayEntry = {
      id: crypto.randomUUID(),
      ...form,
      view: activeView === "psychology" ? "daily" : activeView,
    };
    setEntries((prev) => [entry, ...prev]);
    setIsWriting(false);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      emotionalState: "calm",
      executionQuality: 7,
      disciplineScore: 7,
      notes: "",
      lessons: "",
      mistakes: "",
    });
    toast({ title: "Journal entry saved." });
  };

  const emotionConfig = EMOTIONAL_STATES.find((e) => e.value === form.emotionalState);

  const views: { id: JournalView; label: string; icon: React.ElementType }[] = [
    { id: "daily", label: "Daily", icon: NotebookPen },
    { id: "weekly", label: "Weekly Review", icon: Calendar },
    { id: "monthly", label: "Monthly Review", icon: BookOpen },
    { id: "psychology", label: "Psychology", icon: Brain },
  ];

  const avgExecution = entries.length
    ? (entries.reduce((s, e) => s + e.executionQuality, 0) / entries.length).toFixed(1)
    : "—";
  const avgDiscipline = entries.length
    ? (entries.reduce((s, e) => s + e.disciplineScore, 0) / entries.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <NotebookPen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trading Journal</h1>
            <p className="text-xs text-white/30 font-mono mt-0.5">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsWriting(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Entries", value: entries.length, icon: NotebookPen, color: "text-primary" },
          { label: "Avg Execution", value: avgExecution, icon: Target, color: "text-blue-400" },
          { label: "Avg Discipline", value: avgDiscipline, icon: CheckCircle2, color: "text-green-400" },
          {
            label: "Dominant Emotion",
            value: entries.length
              ? EMOTIONAL_STATES.find(
                  (e) =>
                    e.value ===
                    (Object.entries(
                      entries.reduce((acc, e) => {
                        acc[e.emotionalState] = (acc[e.emotionalState] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort(([, a], [, b]) => b - a)[0]?.[0] || "calm")
                )?.label ?? "—"
              : "—",
            icon: Brain,
            color: "text-yellow-400",
          },
        ].map((stat) => (
          <Card key={stat.label} className="bg-[#0d0d14] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">{stat.label}</span>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* View tabs */}
        <div className="lg:col-span-1 space-y-1">
          <div className="bg-[#0d0d14] border border-white/[0.06] rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <span className="text-[10px] font-mono font-bold text-white/25 tracking-widest uppercase">Views</span>
            </div>
            {views.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors border-b border-white/[0.04] last:border-0 ${
                  activeView === v.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-white/40 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                <v.icon className="h-4 w-4 shrink-0" />
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          {/* Psychology scoring summary */}
          {entries.length > 0 && (
            <div className="bg-[#0d0d14] border border-white/[0.06] rounded-lg p-3 space-y-3">
              <span className="text-[10px] font-mono font-bold text-white/25 tracking-widest uppercase">Psych Scores</span>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Execution</span>
                  <span className="font-mono text-blue-400 font-bold">{avgExecution}/10</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1">
                  <div
                    className="bg-blue-400 h-1 rounded-full transition-all"
                    style={{ width: `${(Number(avgExecution) / 10) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Discipline</span>
                  <span className="font-mono text-green-400 font-bold">{avgDiscipline}/10</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1">
                  <div
                    className="bg-green-400 h-1 rounded-full transition-all"
                    style={{ width: `${(Number(avgDiscipline) / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {/* New Entry Form */}
          {isWriting && (
            <Card className="bg-[#0d0d14] border-primary/20">
              <CardHeader className="pb-3 border-b border-white/[0.06]">
                <CardTitle className="text-sm flex items-center gap-2">
                  <NotebookPen className="h-4 w-4 text-primary" />
                  New Journal Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/40 uppercase tracking-widest">Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="bg-background border-white/[0.08] text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/40 uppercase tracking-widest">Emotional State</Label>
                    <Select
                      value={form.emotionalState}
                      onValueChange={(v) => setForm((f) => ({ ...f, emotionalState: v }))}
                    >
                      <SelectTrigger className="bg-background border-white/[0.08] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMOTIONAL_STATES.map((e) => (
                          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ScoreSlider
                    label="Execution Quality"
                    value={form.executionQuality}
                    onChange={(v) => setForm((f) => ({ ...f, executionQuality: v }))}
                    color="text-blue-400"
                  />
                  <ScoreSlider
                    label="Discipline Score"
                    value={form.disciplineScore}
                    onChange={(v) => setForm((f) => ({ ...f, disciplineScore: v }))}
                    color="text-green-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-white/40 uppercase tracking-widest">Journal Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="How was your trading session today? What did you observe in the market? How did you feel entering and exiting positions?"
                    className="min-h-[120px] bg-background border-white/[0.08] text-sm font-mono resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      Lessons Learned
                    </Label>
                    <Textarea
                      value={form.lessons}
                      onChange={(e) => setForm((f) => ({ ...f, lessons: e.target.value }))}
                      placeholder="What did this session teach you?"
                      className="min-h-[80px] bg-background border-white/[0.08] text-sm font-mono resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                      Mistakes / Errors
                    </Label>
                    <Textarea
                      value={form.mistakes}
                      onChange={(e) => setForm((f) => ({ ...f, mistakes: e.target.value }))}
                      placeholder="What could you have done better?"
                      className="min-h-[80px] bg-background border-white/[0.08] text-sm font-mono resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setIsWriting(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSave}>Save Entry</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entry list */}
          {entries.length === 0 && !isWriting ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <NotebookPen className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-white/30 text-sm">No journal entries yet.</p>
              <p className="text-white/20 text-xs mt-1">Start logging your trading mindset and sessions.</p>
              <Button size="sm" className="mt-4 gap-2" onClick={() => setIsWriting(true)}>
                <Plus className="h-4 w-4" />
                Write First Entry
              </Button>
            </div>
          ) : (
            entries.map((entry) => {
              const emotion = EMOTIONAL_STATES.find((e) => e.value === entry.emotionalState);
              return (
                <Card key={entry.id} className="bg-[#0d0d14] border-white/[0.06] hover:border-white/[0.1] transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-white/80 font-mono">
                          {format(new Date(entry.date), "EEEE, MMMM d, yyyy")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-[10px] px-2 py-0.5 ${emotion?.color}`}>
                            {emotion?.label}
                          </Badge>
                          <span className="text-[10px] text-white/25 font-mono">
                            Exec: {entry.executionQuality}/10 · Disc: {entry.disciplineScore}/10
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-white/20 mt-1" />
                    </div>
                    <p className="text-sm text-white/50 font-mono leading-relaxed whitespace-pre-wrap line-clamp-3">
                      {entry.notes}
                    </p>
                    {(entry.lessons || entry.mistakes) && (
                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                        {entry.lessons && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[10px] text-green-400/60 uppercase tracking-widest font-mono">
                              <CheckCircle2 className="h-3 w-3" />
                              Lessons
                            </div>
                            <p className="text-xs text-white/40 font-mono">{entry.lessons}</p>
                          </div>
                        )}
                        {entry.mistakes && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[10px] text-red-400/60 uppercase tracking-widest font-mono">
                              <XCircle className="h-3 w-3" />
                              Mistakes
                            </div>
                            <p className="text-xs text-white/40 font-mono">{entry.mistakes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
