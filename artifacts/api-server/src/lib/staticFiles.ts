import path from "path";
import fs from "fs";
import express, { type Express, type Request, type Response } from "express";

const IMMUTABLE = "public, max-age=31536000, immutable";
const MEDIA_DAY = "public, max-age=86400";
const NO_CACHE  = "no-cache";
const NO_STORE  = "no-store";

// In the built ESM bundle, __dirname is the dist/ directory of the api-server artifact.
// From dist/ → ../../blazeos/dist/public resolves correctly regardless of CWD.
const STATIC_DIR =
  process.env["STATIC_DIR"] ??
  path.resolve(__dirname, "../../blazeos/dist/public");

const IMMUTABLE_PREFIXES = ["vendor-", "app-api-"];

const MEDIA_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".mp4", ".webm",
]);

function cacheHeaderForPath(filePath: string): string {
  const base = path.basename(filePath);
  const ext  = path.extname(filePath).toLowerCase();

  if (ext === ".html") return NO_STORE;
  if (IMMUTABLE_PREFIXES.some((p) => base.startsWith(p))) return IMMUTABLE;
  if (MEDIA_EXTENSIONS.has(ext)) return MEDIA_DAY;
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
