export async function getCurrentUser(): Promise<{ id: string; name?: string } | null> {
  try {
    const res = await fetch("/api/auth/user");
    if (res.ok) return res.json();
    return null;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<{ id: string; name?: string }> {
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
