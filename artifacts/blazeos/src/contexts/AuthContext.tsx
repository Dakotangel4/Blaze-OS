import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type AuthUser = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileImage?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data: { id: string; name?: string } | null) => {
        setUser(data ? { id: data.id, name: data.name ?? null } : null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    queryClient.clear();
    setUser(null);
    window.location.href = "/api/logout";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
