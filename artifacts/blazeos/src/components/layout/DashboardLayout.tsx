import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  TrendingUp,
  Calculator,
  BookOpen,
  Users,
  Calendar,
  Bot,
  DollarSign,
  LogOut,
  Flame,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Trading Hub", href: "/trading", icon: TrendingUp },
  { name: "Risk Calc", href: "/risk", icon: Calculator },
  { name: "Knowledge Vault", href: "/knowledge", icon: BookOpen },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "AI Center", href: "/ai", icon: Bot },
  { name: "Finance", href: "/finance", icon: DollarSign },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col gap-1 w-full">
      {navItems.map((item) => {
        const isActive = location === item.href || location.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} onClick={onClick}>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6 flex items-center gap-3">
          <Flame className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl tracking-tight">BlazeOS</span>
        </div>
        
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.fullName || "User"}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">BlazeOS</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-card border-r-border p-0 flex flex-col">
              <div className="p-6 flex items-center gap-3 border-b border-border">
                <Flame className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl tracking-tight">BlazeOS</span>
              </div>
              <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <NavLinks onClick={() => setMobileMenuOpen(false)} />
              </nav>
              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => signOut({ redirectUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
