import { createClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";

const supabaseUrl = process.env["SUPABASE_URL"];
const serviceKey  = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl) throw new Error("SUPABASE_URL environment variable is required");
if (!serviceKey)  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface SupabaseUser {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: SupabaseUser;
    }
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    req.supabaseUser = { id: data.user.id, email: data.user.email };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};
