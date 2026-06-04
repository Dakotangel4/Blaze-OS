import type { RequestHandler } from "express";

export const CACHE = {
  IMMUTABLE: "public, max-age=31536000, immutable",
  NO_CACHE: "no-cache",
  NO_STORE: "no-store",
  HEALTH: "public, max-age=10, s-maxage=10",
  READ_PRIVATE: "private, no-cache, must-revalidate",
} as const;

export function noStore(): RequestHandler {
  return (_req, res, next) => {
    res.setHeader("Cache-Control", CACHE.NO_STORE);
    next();
  };
}

export function noCache(): RequestHandler {
  return (_req, res, next) => {
    res.setHeader("Cache-Control", CACHE.NO_CACHE);
    next();
  };
}

export function privateReadCache(): RequestHandler {
  return (req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD") {
      res.setHeader("Cache-Control", CACHE.READ_PRIVATE);
    } else {
      res.setHeader("Cache-Control", CACHE.NO_STORE);
    }
    next();
  };
}

export function publicShortCache(maxAge = 10): RequestHandler {
  return (_req, res, next) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAge}, s-maxage=${maxAge}`);
    next();
  };
}

export const apiCacheMiddleware: RequestHandler = (req, res, next) => {
  const method = req.method.toUpperCase();
  const path = req.path;

  if (path === "/healthz") {
    res.setHeader("Cache-Control", CACHE.HEALTH);
    return next();
  }

  if (method !== "GET" && method !== "HEAD") {
    res.setHeader("Cache-Control", CACHE.NO_STORE);
    return next();
  }

  res.setHeader("Cache-Control", CACHE.READ_PRIVATE);
  next();
};
