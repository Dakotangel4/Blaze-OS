import { lazy, Suspense } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader, type PageLoaderVariant } from "@/components/ui/page-loader";

import DashboardLayout from "@/components/layout/DashboardLayout";

const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const TradingHub = lazy(() => import("@/pages/TradingHub"));
const Journal = lazy(() => import("@/pages/Journal"));
const RiskCalculator = lazy(() => import("@/pages/RiskCalculator"));
const EconomicCalendar = lazy(() => import("@/pages/EconomicCalendar"));
const Execution = lazy(() => import("@/pages/Execution"));
const AICenter = lazy(() => import("@/pages/AICenter"));
const AIValidator = lazy(() => import("@/pages/AIValidator"));
const KnowledgeVault = lazy(() => import("@/pages/KnowledgeVault"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const PerformanceDNA = lazy(() => import("@/pages/PerformanceDNA"));
const PropFirmTracker = lazy(() => import("@/pages/PropFirmTracker"));
const Sessions = lazy(() => import("@/pages/Sessions"));
const Playbooks = lazy(() => import("@/pages/Playbooks"));
const Psychology = lazy(() => import("@/pages/Psychology"));
const Settings = lazy(() => import("@/pages/Settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  },
});

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
  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <Landing />
    </Suspense>
  );
}

function ProtectedRoute({
  component: Component,
  label,
  variant = "default",
}: {
  component: React.ElementType;
  label: string;
  variant?: PageLoaderVariant;
}) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) {
    window.location.href = "/api/login";
    return <AuthLoadingScreen />;
  }
  return (
    <DashboardLayout>
      <ErrorBoundary pageName={label}>
        <Suspense fallback={<PageLoader variant={variant} />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />

      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} label="Dashboard" variant="dashboard" />
      </Route>
      <Route path="/trading">
        <ProtectedRoute component={TradingHub} label="Trading Hub" variant="trading" />
      </Route>
      <Route path="/trading-hub">
        <ProtectedRoute component={TradingHub} label="Trading Hub" variant="trading" />
      </Route>
      <Route path="/journal">
        <ProtectedRoute component={Journal} label="Journal" variant="table" />
      </Route>
      <Route path="/risk">
        <ProtectedRoute component={RiskCalculator} label="Risk Calculator" />
      </Route>
      <Route path="/calendar">
        <ProtectedRoute component={EconomicCalendar} label="Economic Calendar" />
      </Route>
      <Route path="/execution">
        <ProtectedRoute component={Execution} label="Execution" variant="table" />
      </Route>
      <Route path="/ai">
        <ProtectedRoute component={AICenter} label="AI Center" />
      </Route>
      <Route path="/knowledge">
        <ProtectedRoute component={KnowledgeVault} label="Knowledge Vault" />
      </Route>
      <Route path="/knowledge-vault">
        <ProtectedRoute component={KnowledgeVault} label="Knowledge Vault" />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} label="Analytics" variant="table" />
      </Route>
      <Route path="/performance">
        <ProtectedRoute component={PerformanceDNA} label="Performance DNA" variant="table" />
      </Route>
      <Route path="/prop-firm">
        <ProtectedRoute component={PropFirmTracker} label="Prop Firm Tracker" variant="table" />
      </Route>
      <Route path="/sessions">
        <ProtectedRoute component={Sessions} label="Sessions" />
      </Route>
      <Route path="/playbooks">
        <ProtectedRoute component={Playbooks} label="Playbooks" />
      </Route>
      <Route path="/psychology">
        <ProtectedRoute component={Psychology} label="Psychology" />
      </Route>
      <Route path="/ai-validator">
        <ProtectedRoute component={AIValidator} label="AI Validator" />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} label="Settings" />
      </Route>

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
