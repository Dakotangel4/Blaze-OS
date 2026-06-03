import { useLocation } from "wouter";
import { PlusCircle, BookOpen, Calculator, Calendar } from "lucide-react";

interface QuickActionsProps {
  onNewTrade: () => void;
}

const actions = [
  { label: "Log Trade", icon: PlusCircle, color: "text-primary", key: "trade" },
  { label: "Knowledge", icon: BookOpen, color: "text-blue-400", key: "knowledge" },
  { label: "Risk Calc", icon: Calculator, color: "text-yellow-400", key: "risk" },
  { label: "Calendar", icon: Calendar, color: "text-purple-400", key: "calendar" },
];

export function QuickActions({ onNewTrade }: QuickActionsProps) {
  const [, navigate] = useLocation();

  const handleAction = (key: string) => {
    switch (key) {
      case "trade": onNewTrade(); break;
      case "knowledge": navigate("/knowledge"); break;
      case "risk": navigate("/risk"); break;
      case "calendar": navigate("/calendar"); break;
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ label, icon: Icon, color, key }) => (
        <button
          key={key}
          onClick={() => handleAction(key)}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all text-xs text-white/50 hover:text-white/80"
          style={{ backgroundColor: "#111827" }}
        >
          <Icon className={`h-4 w-4 ${color}`} />
          {label}
        </button>
      ))}
    </div>
  );
}
