import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing server-side Supabase env vars: SUPABASE_URL and SUPABASE_ANON_KEY are required.",
  );
}

/**
 * Server-side Supabase client for the Express API.
 *
 * Uses the anon key — sufficient for auth.getUser() JWT verification.
 * Session auto-refresh and URL session detection are disabled because this
 * client runs in a stateless server context, not a browser.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionFromUrl: false,
  },
});

/**
 * Verifies a Supabase access token (JWT) and returns the associated User,
 * or null if the token is invalid or expired.
 *
 * This makes a lightweight network call to the Supabase auth service.
 */
export async function verifyToken(accessToken: string): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) return null;
  return user;
}
