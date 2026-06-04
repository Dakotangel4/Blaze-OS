/**
 * Server-side utilities for BlazeOS.
 *
 * In a Vite SPA architecture, "server-side" operations are handled by the
 * Express API server (artifacts/api-server). This module provides helpers
 * for making authenticated calls to that API with the Supabase JWT attached.
 *
 * For the actual server-side Supabase client used by the Express API, see:
 *   artifacts/api-server/src/utils/supabase/server.ts
 */

import { supabase } from "./client";

/**
 * Returns HTTP headers containing the current user's Supabase JWT as a Bearer
 * token. Attach these to any manual fetch() calls to the Express API to ensure
 * the request is authenticated.
 *
 * All generated @workspace/api-client-react hooks attach this token
 * automatically via the registered setAuthTokenGetter — this helper is only
 * needed for manual fetch() calls.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return { "Content-Type": "application/json" };

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

/**
 * A typed fetch wrapper that automatically attaches the Supabase auth token to
 * every request. Use for any ad-hoc calls to the Express API that are not
 * covered by generated hooks.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getAuthHeaders();

  const res = await fetch(path, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}
