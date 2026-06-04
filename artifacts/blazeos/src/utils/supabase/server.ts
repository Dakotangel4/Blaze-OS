/**
 * API fetch helper — now uses session cookies (Replit Auth).
 * No Bearer token needed; cookies are sent automatically.
 */

export async function getAuthHeaders(): Promise<Record<string, string>> {
  return { "Content-Type": "application/json" };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}
