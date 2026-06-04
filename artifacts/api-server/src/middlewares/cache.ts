import type { RequestHandler } from "express";

export const CACHE = {
  IMMUTABLE:        "public, max-age=31536000, immutable",
  MEDIA_DAY:        "public, max-age=86400",
  NO_CACHE:         "no-cache",
  NO_STORE:         "no-store",
  HEALTH:           "public, max-age=10, s-maxage=10",
  CALENDAR_READ:    "private, max-age=60, must-revalidate",
  MARKET_DATA:      "public, max-age=5, s-maxage=5, stale-while-revalidate=3",
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
      res.setHeader("Cache-Control", CACHE.CALENDAR_READ);
    } else {
      res.setHeader("Cache-Control", CACHE.NO_STORE);
    }
    next();
  };
}

export function publicShortCache(maxAge = 10): RequestHandler {
  return (_req, res, next) => {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    );
    next();
  };
}

const GET_CACHE_ROUTES: Array<{ pattern: RegExp; header: string }> = [
  { pattern: /^\/healthz$/,           header: CACHE.HEALTH },
  { pattern: /^\/calendar($|\?|\/)/,  header: CACHE.CALENDAR_READ },
  { pattern: /^\/dashboard\/summary$/, header: CACHE.CALENDAR_READ },
];

export const apiCacheMiddleware: RequestHandler = (req, res, next) => {
  const method = req.method.toUpperCase();
  const reqPath = req.path;

  if (method !== "GET" && method !== "HEAD") {
    res.setHeader("Cache-Control", CACHE.NO_STORE);
    return next();
  }

  for (const route of GET_CACHE_ROUTES) {
    if (route.pattern.test(reqPath)) {
      res.setHeader("Cache-Control", route.header);
      return next();
    }
  }

  res.setHeader("Cache-Control", CACHE.NO_STORE);
  next();
};
