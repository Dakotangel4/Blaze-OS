import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.",
  );
}

/**
 * Creates a Supabase browser client using @supabase/ssr.
 * Uses cookie-based session storage for improved security over localStorage.
 * createBrowserClient internally deduplicates clients with the same URL+key,
 * so calling this multiple times is safe and returns the same instance.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
