import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { requireAuth } from "./middlewares/auth";

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

/**
 * Auth middleware — applied to all /api routes except /api/health.
 * Every request must include a valid Supabase JWT in the Authorization header.
 * The authenticated User is attached to req.user for use in route handlers.
 */
app.use("/api", (req, res, next) => {
  if (req.path === "/healthz") return next();
  return requireAuth(req, res, next);
});

app.use("/api", router);

export default app;
