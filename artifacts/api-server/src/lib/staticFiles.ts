import path from "path";
import fs from "fs";
import express, { type Express, type Request, type Response } from "express";

const IMMUTABLE = "public, max-age=31536000, immutable";
const NO_CACHE = "no-cache";
const NO_STORE = "no-store";

const STATIC_DIR =
  process.env["STATIC_DIR"] ??
  path.resolve(process.cwd(), "../blazeos/dist/public");

function cacheHeaderForPath(filePath: string): string {
  const base = path.basename(filePath);

  if (base.endsWith(".html")) {
    return NO_STORE;
  }

  if (
    base.startsWith("vendor-") ||
    base.startsWith("app-api-")
  ) {
    return IMMUTABLE;
  }

  return NO_CACHE;
}

export function mountStaticFiles(app: Express): boolean {
  if (!fs.existsSync(STATIC_DIR)) {
    return false;
  }

  app.use(
    express.static(STATIC_DIR, {
      maxAge: 0,
      etag: true,
      lastModified: true,
      setHeaders(res, filePath) {
        res.setHeader("Cache-Control", cacheHeaderForPath(filePath));
      },
    }),
  );

  const indexHtml = path.join(STATIC_DIR, "index.html");
  app.use((_req: Request, res: Response) => {
    res.setHeader("Cache-Control", NO_STORE);
    res.sendFile(indexHtml);
  });

  return true;
}
