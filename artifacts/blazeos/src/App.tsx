import { lazy, Suspense } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader, type PageLoaderVariant } from "@/components/ui/page-loader";
import { supabaseConfigured } from "@/utils/supabase/client";

import DashboardLayout from "@/components/layout/DashboardLayout";

function SupabaseConfigError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full rounded-xl border border-destructive/30 bg-destructive/10 p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-mono tracking-widest uppercase text-destructive">
            Configuration Error
          </span>
        </div>
        <h1 className="text-xl font-bold font-mono tracking-tight">
          Supabase credentials missing
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          BlazeOS requires Supabase to handle authentication. Add the following
          secrets in your project's Secrets panel, then restart the server:
        </p>
        <ul className="space-y-2">
          {["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"].map((key) => (
            <li
              key={key}
              className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-black/30 px-3 py-2 font-mono text-xs text-white/70"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" />
              {key}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground font-mono">
          Find these in your Supabase dashboard → Project Settings → API.
        </p>
      </div>
    </div>
  );
}

const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const TradingHub = lazy(() => import("@/pages/TradingHub"));
const Journal = lazy(() => import("@/pages/Journal"));
const RiskCalculator = lazy(() => import("@/pages/RiskCalculator"));
const EconomicCalendar = lazy(() => import("@/pages/EconomicCalendar"));
const Execution = lazy(() => import("@/pages/Execution"));
const AICenter = lazy(() => import("@/pages/AICenter"));
const KnowledgeVault = lazy(() => import("@/pages/KnowledgeVault"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const PropFirmTracker = lazy(() => import("@/pages/PropFirmTracker"));
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
      <Route path="/prop-firm">
        <ProtectedRoute component={PropFirmTracker} label="Prop Firm Tracker" variant="table" />
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
  if (!supabaseConfigured) {
    return <SupabaseConfigError />;
  }
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
