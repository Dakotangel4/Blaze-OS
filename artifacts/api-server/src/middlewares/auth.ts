import type { Request, Response, NextFunction } from "express";
import { isAuthenticated } from "../utils/supabaseAuth";

export { isAuthenticated as requireAuth };

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  next();
}
