import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import TradingHub from "@/pages/TradingHub";
import RiskCalculator from "@/pages/RiskCalculator";
import KnowledgeVault from "@/pages/KnowledgeVault";
import EconomicCalendar from "@/pages/EconomicCalendar";
import AICenter from "@/pages/AICenter";
import Settings from "@/pages/Settings";
import Journal from "@/pages/Journal";
import Execution from "@/pages/Execution";
import Analytics from "@/pages/Analytics";
import PropFirmTracker from "@/pages/PropFirmTracker";
import DashboardLayout from "@/components/layout/DashboardLayout";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
        </div>
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
          Verifying session…
        </p>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (user) return <Redirect to="/dashboard" />;
  return <Landing />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) {
    window.location.href = "/api/login";
    return <AuthLoadingScreen />;
  }
  return (
    <DashboardLayout>
      <ErrorBoundary pageName={Component.displayName ?? Component.name}>
        <Component />
      </ErrorBoundary>
    </DashboardLayout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />

      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/trading"><ProtectedRoute component={TradingHub} /></Route>
      <Route path="/trading-hub"><ProtectedRoute component={TradingHub} /></Route>
      <Route path="/journal"><ProtectedRoute component={Journal} /></Route>
      <Route path="/risk"><ProtectedRoute component={RiskCalculator} /></Route>
      <Route path="/calendar"><ProtectedRoute component={EconomicCalendar} /></Route>
      <Route path="/execution"><ProtectedRoute component={Execution} /></Route>
      <Route path="/ai"><ProtectedRoute component={AICenter} /></Route>
      <Route path="/knowledge"><ProtectedRoute component={KnowledgeVault} /></Route>
      <Route path="/knowledge-vault"><ProtectedRoute component={KnowledgeVault} /></Route>
      <Route path="/analytics"><ProtectedRoute component={Analytics} /></Route>
      <Route path="/prop-firm"><ProtectedRoute component={PropFirmTracker} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>

      <Route>
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="text-center">
            <h1 className="text-4xl font-bold font-mono tracking-tighter text-destructive">404</h1>
            <p className="text-muted-foreground mt-2 font-mono">System endpoint not found</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider delayDuration={0}>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
