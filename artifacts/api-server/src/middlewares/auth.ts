import type { Request, Response, NextFunction } from "express";
import type { User } from "@supabase/supabase-js";
import { verifyToken } from "../utils/supabase/server";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Express middleware that requires a valid Supabase JWT.
 *
 * Expects: Authorization: Bearer <access_token>
 *
 * On success: attaches the verified User to req.user and calls next().
 * On failure: responds 401 with a JSON error.
 *
 * All routes under /api (except /api/health) are protected by this middleware.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers["authorization"];

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or malformed Authorization header. Expected: Bearer <token>",
    });
    return;
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token);

  if (!user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired session token. Please sign in again.",
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Express middleware that optionally attaches a verified User to req.user.
 * Does NOT reject unauthenticated requests — use requireAuth for that.
 *
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers["authorization"];

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await verifyToken(token);
    if (user) req.user = user;
  }

  next();
}
