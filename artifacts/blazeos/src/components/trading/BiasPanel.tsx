import { useState } from "react";
import { useGetDailyBias, useUpdateDailyBias } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X } from "lucide-react";
import { format } from "date-fns";

const BIAS_OPTIONS = ["BULLISH", "BEARISH", "NEUTRAL", "RANGING"];

const biasColor: Record<string, string> = {
  BULLISH: "text-green-400",
  BEARISH: "text-red-400",
  NEUTRAL: "text-yellow-400",
  RANGING: "text-blue-400",
};

export function BiasPanel() {
  const { data: bias, refetch } = useGetDailyBias();
  const updateBias = useUpdateDailyBias();
  const [editing, setEditing] = useState(false);
  const [direction, setDirection] = useState("");
  const [notes, setNotes] = useState("");

  const startEdit = () => {
    setDirection(bias?.direction ?? "NEUTRAL");
    setNotes(bias?.notes ?? "");
    setEditing(true);
  };

  const save = () => {
    updateBias.mutate(
      { data: { direction, notes } },
      {
        onSuccess: () => {
          setEditing(false);
          refetch();
        },
      }
    );
  };

  const dirColor = biasColor[bias?.direction ?? ""] ?? "text-white/60";

  return (
    <div className="rounded-xl border border-white/[0.08] p-4" style={{ backgroundColor: "#111827" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Daily Bias — XAUUSD</h2>
        {!editing && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white/70" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="h-8 text-sm bg-black/30 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BIAS_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            className="text-xs bg-black/30 border-white/10 resize-none h-20"
            placeholder="DXY context, key levels, liquidity targets..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={save} disabled={updateBias.isPending}>
              <Check className="h-3 w-3 mr-1" />
              {updateBias.isPending ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : bias ? (
        <div className="space-y-1.5">
          <p className={`text-xl font-bold tracking-tight ${dirColor}`}>
            {bias.direction}
          </p>
          {bias.notes && (
            <p className="text-xs text-white/50 leading-relaxed">{bias.notes}</p>
          )}
          <p className="text-[10px] text-white/25">
            Updated {format(new Date(bias.updatedAt), "MMM d, HH:mm")}
          </p>
        </div>
      ) : (
        <button
          className="text-xs text-white/30 hover:text-primary transition-colors"
          onClick={startEdit}
        >
          + Set today's bias
        </button>
      )}
    </div>
  );
}
