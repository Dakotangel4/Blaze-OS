import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export function useRequireAuth(redirectTo = "/api/login"): boolean {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo;
    }
  }, [user, loading, redirectTo, navigate]);

  return loading;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo = "/api/login",
): React.FC<P> {
  function AuthProtected(props: P) {
    const loading = useRequireAuth(redirectTo);
    if (loading) return null;
    return <Component {...props} />;
  }
  AuthProtected.displayName = `withAuth(${Component.displayName ?? Component.name ?? "Component"})`;
  return AuthProtected;
}
