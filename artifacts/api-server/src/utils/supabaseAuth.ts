export { isAuthenticated } from "./replitAuth";
export type { ReplitUser as SupabaseUser } from "./replitAuth";

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: { id: string; email?: string };
    }
  }
}
