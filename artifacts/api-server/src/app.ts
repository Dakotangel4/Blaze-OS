import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { mountStaticFiles } from "./lib/staticFiles";
import { isAuthenticated } from "./utils/replitAuth";
import { apiCacheMiddleware } from "./middlewares/cache";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export async function createApp(): Promise<Express> {
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const user = req.replitUser!;
    res.json({ id: user.id, name: user.name ?? null });
  });

  app.use("/api", apiCacheMiddleware);

  app.use("/api", (req, res, next) => {
    if (req.path === "/healthz") return next();
    return isAuthenticated(req, res, next);
  });

  app.use("/api", router);

  if (process.env["NODE_ENV"] === "production") {
    const mounted = mountStaticFiles(app);
    if (mounted) {
      logger.info({ dir: process.env["STATIC_DIR"] ?? "../blazeos/dist/public" }, "Serving static files");
    } else {
      logger.warn("Static dir not found — skipping static file serving");
    }
  }

  return app;
}

export default app;
