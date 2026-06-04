/**
 * Auth helpers — now uses Replit Auth (session cookies).
 * The supabase-based helpers are replaced with fetch-based equivalents.
 */

export async function getCurrentUser(): Promise<{ id: string } | null> {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<{ id: string }> {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "/api/login";
    throw new Error("Authentication required.");
  }
  return user;
}

export async function signOut(): Promise<void> {
  window.location.href = "/api/logout";
}

export async function getSession(): Promise<null> {
  return null;
}

export async function getAccessToken(): Promise<null> {
  return null;
}
