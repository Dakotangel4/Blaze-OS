import type { Request, Response, NextFunction } from "express";
import { isAuthenticated } from "../utils/replitAuth";

declare global {
  namespace Express {
    interface Request {
      replitUserId?: string;
    }
  }
}

export { isAuthenticated as requireAuth };

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const user = req.user as Record<string, unknown> | undefined;
    const claims = user?.["claims"] as Record<string, unknown> | undefined;
    if (claims?.["sub"]) {
      req.replitUserId = claims["sub"] as string;
    }
  }
  next();
}
