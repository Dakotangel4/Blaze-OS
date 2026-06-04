/**
 * Stub Supabase client for backward compatibility during auth migration.
 * Authentication is now handled via Replit Auth (session cookies).
 * This file is kept to avoid breaking imports that haven't been updated yet.
 */

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => {},
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: new Error("Storage not available") }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      remove: async () => ({ error: null }),
    }),
  },
};

export function createClient() {
  return supabase;
}
