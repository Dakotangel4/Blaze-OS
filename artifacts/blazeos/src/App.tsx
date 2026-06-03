import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import TradingHub from "@/pages/TradingHub";
import RiskCalculator from "@/pages/RiskCalculator";
import KnowledgeVault from "@/pages/KnowledgeVault";
import CRM from "@/pages/CRM";
import EconomicCalendar from "@/pages/EconomicCalendar";
import AICenter from "@/pages/AICenter";
import FinanceTracker from "@/pages/FinanceTracker";
import Settings from "@/pages/Settings";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SignInPage from "@/pages/SignIn";
import SignUpPage from "@/pages/SignUp";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Redirect to="/dashboard" />;
  return <Landing />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/sign-in" />;
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Redirect to="/dashboard" />;
  return <Component />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in"><AuthRoute component={SignInPage} /></Route>
      <Route path="/sign-up"><AuthRoute component={SignUpPage} /></Route>

      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/trading"><ProtectedRoute component={TradingHub} /></Route>
      <Route path="/risk"><ProtectedRoute component={RiskCalculator} /></Route>
      <Route path="/knowledge"><ProtectedRoute component={KnowledgeVault} /></Route>
      <Route path="/crm"><ProtectedRoute component={CRM} /></Route>
      <Route path="/calendar"><ProtectedRoute component={EconomicCalendar} /></Route>
      <Route path="/ai"><ProtectedRoute component={AICenter} /></Route>
      <Route path="/finance"><ProtectedRoute component={FinanceTracker} /></Route>
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
