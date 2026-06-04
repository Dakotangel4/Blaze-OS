import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckSquare, Clock, DollarSign, ArrowRight } from "lucide-react";

export interface ClientProposalInputs {
  businessName: string;
  industry: string;
  servicesNeeded: string;
  budget: string;
}

export interface ClientProposalResult {
  executiveSummary: string;
  websiteProposal: string;
  featuresList: string[];
  timeline: string;
  pricingStructure: string;
  deliverables: string[];
  nextSteps: string;
}

interface Props {
  onSubmit: (inputs: Record<string, string>) => void;
  result: ClientProposalResult | null;
  isLoading: boolean;
}

export default function ClientProposal({ onSubmit, result, isLoading }: Props) {
  const [inputs, setInputs] = useState<ClientProposalInputs>({
    businessName: "",
    industry: "",
    servicesNeeded: "",
    budget: "",
  });

  const set = (k: keyof ClientProposalInputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInputs((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      "Business Name": inputs.businessName,
      Industry: inputs.industry,
      "Services Needed": inputs.servicesNeeded,
      Budget: inputs.budget,
    });
  };

  if (result && !isLoading) {
    return (
      <div className="space-y-4 font-mono">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-primary text-xs font-bold tracking-widest mb-2">
            <FileText className="h-3.5 w-3.5" /> EXECUTIVE SUMMARY
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{result.executiveSummary}</p>
        </div>

        <div className="bg-white/[0.03] border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-foreground text-xs font-bold tracking-widest mb-2">
            <FileText className="h-3.5 w-3.5" /> PROPOSAL
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{result.websiteProposal}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold tracking-widest">
              <CheckSquare className="h-3.5 w-3.5" /> FEATURES
            </div>
            {result.featuresList.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <span className="text-green-400 text-xs">✓</span> {f}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold tracking-widest mb-2">
                <Clock className="h-3.5 w-3.5" /> TIMELINE
              </div>
              <p className="text-sm text-foreground/80">{result.timeline}</p>
            </div>
            <div className="bg-blue-400/5 border border-blue-400/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-widest mb-2">
                <DollarSign className="h-3.5 w-3.5" /> PRICING
              </div>
              <p className="text-sm text-foreground/80 font-bold">{result.pricingStructure}</p>
            </div>
          </div>
        </div>

        {result.deliverables?.length > 0 && (
          <div className="bg-white/[0.03] border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground text-xs font-bold tracking-widest">
              DELIVERABLES
            </div>
            <div className="grid grid-cols-2 gap-1">
              {result.deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="text-primary text-xs">▸</span> {d}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-primary text-xs font-bold tracking-widest mb-2">
            <ArrowRight className="h-3.5 w-3.5" /> NEXT STEPS
          </div>
          <p className="text-sm text-foreground/80">{result.nextSteps}</p>
        </div>

        <div className="text-center pt-1">
          <button
            onClick={() => onSubmit({})}
            className="text-xs text-muted-foreground hover:text-foreground font-mono underline underline-offset-2 transition-colors"
          >
            ← GENERATE NEW PROPOSAL
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">BUSINESS NAME</Label>
          <Input value={inputs.businessName} onChange={set("businessName")} placeholder="Acme Corp" required className="font-mono bg-background border-border" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground tracking-widest">INDUSTRY</Label>
          <Input value={inputs.industry} onChange={set("industry")} placeholder="E-commerce, SaaS, Hospitality…" required className="font-mono bg-background border-border" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground tracking-widest">SERVICES NEEDED</Label>
        <Textarea value={inputs.servicesNeeded} onChange={set("servicesNeeded")} placeholder="Website redesign, e-commerce store, SEO, branding…" rows={3} required className="font-mono text-sm bg-background border-border resize-none" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground tracking-widest">BUDGET RANGE</Label>
        <Input value={inputs.budget} onChange={set("budget")} placeholder="$5,000 – $10,000" className="font-mono bg-background border-border" />
      </div>
      <button
        type="submit"
        disabled={isLoading || !inputs.businessName || !inputs.servicesNeeded}
        className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-mono font-bold text-sm tracking-widest rounded-md transition-colors"
      >
        {isLoading ? "GENERATING…" : "▶ GENERATE PROPOSAL"}
      </button>
    </form>
  );
}
