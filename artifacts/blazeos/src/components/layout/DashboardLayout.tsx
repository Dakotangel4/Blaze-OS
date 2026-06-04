import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  TrendingUp,
  Calculator,
  BookOpen,
  Calendar,
  Bot,
  Settings,
  LogOut,
  Flame,
  Menu,
  NotebookPen,
  Zap,
  BarChart3,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = { name: string; href: string; icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Trading",
    items: [
      { name: "Trading Hub", href: "/trading", icon: TrendingUp },
      { name: "Journal", href: "/journal", icon: NotebookPen },
      { name: "Risk Calculator", href: "/risk", icon: Calculator },
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Execution", href: "/execution", icon: Zap },
    ],
  },
  {
    label: "Analysis",
    items: [
      { name: "AI Center", href: "/ai", icon: Bot },
      { name: "Knowledge Vault", href: "/knowledge", icon: BookOpen },
    ],
  },
  {
    label: "Performance",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Prop Firm Tracker", href: "/prop-firm", icon: Shield },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

function NavGroup({
  group,
  location,
  onClick,
}: {
  group: NavGroup;
  location: string;
  onClick?: () => void;
}) {
  const hasActive = group.items.some(
    (i) => location === i.href || location.startsWith(i.href + "/")
  );
  const [open, setOpen] = useState(hasActive || true);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold tracking-[0.12em] text-white/25 uppercase hover:text-white/50 transition-colors"
      >
        <span>{group.label}</span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && (
        <div className="flex flex-col gap-0.5">
          {group.items.map((item) => {
            const isActive =
              location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={onClick}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all cursor-pointer text-sm border-l-2",
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-primary"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5 border-transparent"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarInner({
  location,
  displayName,
  displayEmail,
  displayInitial,
  signOut,
  onClose,
}: {
  location: string;
  displayName: string;
  displayEmail: string;
  displayInitial: string;
  signOut: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Flame className="h-4 w-4 text-primary" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-white">BlazeOS</span>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-white/30 tracking-widest">LIVE</span>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="px-3 pt-4 pb-2">
        <Link href="/dashboard" onClick={onClose}>
          <div
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all cursor-pointer text-sm border-l-2",
              location === "/dashboard"
                ? "bg-primary/10 text-primary font-medium border-primary"
                : "text-white/40 hover:text-white/80 hover:bg-white/5 border-transparent"
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </div>
        </Link>
      </div>

      {/* Groups */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
        {NAV_GROUPS.map((group) => (
          <NavGroup key={group.label} group={group} location={location} onClick={onClose} />
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2 mb-1 rounded-md bg-white/[0.03]">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {displayInitial}
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-xs font-medium text-white/80 truncate">{displayName}</span>
            <span className="text-[10px] text-white/30 truncate font-mono">{displayEmail}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-white/30 hover:text-red-400 hover:bg-red-500/10 h-8 text-xs"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const sidebarProps = { location, displayName, displayEmail, displayInitial, signOut };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-white/[0.06] bg-[#0a0a0f]">
        <SidebarInner {...sidebarProps} />
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0a0a0f]">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm tracking-tight">BlazeOS</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 bg-[#0a0a0f] border-r border-white/[0.06] p-0">
              <SidebarInner {...sidebarProps} onClose={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
