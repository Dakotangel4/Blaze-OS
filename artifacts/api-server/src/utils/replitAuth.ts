import type { RequestHandler } from "express";

export interface ReplitUser {
  id: string;
  name?: string;
  profileImage?: string;
}

declare global {
  namespace Express {
    interface Request {
      replitUser?: ReplitUser;
    }
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const userId = req.headers["x-replit-user-id"] as string | undefined;
  const userName = req.headers["x-replit-user-name"] as string | undefined;
  const userUrl = req.headers["x-replit-user-url"] as string | undefined;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  req.replitUser = {
    id: userId,
    name: userName,
    profileImage: userUrl,
  };

  next();
};
