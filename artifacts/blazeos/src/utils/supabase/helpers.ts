import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./client";

/**
 * Returns the currently authenticated user, or null if not signed in.
 * Calls the Supabase auth server to validate the session — more reliable
 * than reading the local session cache.
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the currently authenticated user or throws if not signed in.
 * Use this in contexts where authentication is a hard requirement.
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required. Please sign in.");
  return user;
}

/**
 * Signs the current user out and clears the local session.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Returns the current active session, or null.
 */
export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Returns the current session's access token (JWT), or null.
 * The @supabase/supabase-js client automatically refreshes expired tokens.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}
