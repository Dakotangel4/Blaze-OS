/**
 * Client-side route protection middleware for BlazeOS.
 *
 * In a Vite SPA (no server-side rendering), route guards are implemented as
 * React hooks and higher-order components rather than as HTTP middleware.
 *
 * Protected routes are declared in App.tsx using <ProtectedRoute />, which
 * redirects unauthenticated users to /login. The utilities below provide
 * additional programmatic control for finer-grained protection.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Redirects to `redirectTo` when the user is not authenticated.
 * Returns `true` while the auth state is still loading (use to show a
 * loading state instead of flashing protected content).
 *
 * @example
 * function MyPage() {
 *   const loading = useRequireAuth();
 *   if (loading) return <Spinner />;
 *   return <PageContent />;
 * }
 */
export function useRequireAuth(redirectTo = "/login"): boolean {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [user, loading, redirectTo, navigate]);

  return loading;
}

/**
 * Higher-order component that wraps a component with auth protection.
 * Redirects to `redirectTo` if the user is not authenticated.
 *
 * @example
 * export default withAuth(MyPage);
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo = "/login",
): React.FC<P> {
  function AuthProtected(props: P) {
    const loading = useRequireAuth(redirectTo);
    if (loading) return null;
    return <Component {...props} />;
  }
  AuthProtected.displayName = `withAuth(${Component.displayName ?? Component.name ?? "Component"})`;
  return AuthProtected;
}
