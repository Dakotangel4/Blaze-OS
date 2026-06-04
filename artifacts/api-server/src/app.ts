import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { setupAuth, isAuthenticated } from "./utils/replitAuth";

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
  await setupAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    const user = req.user as Record<string, unknown>;
    const claims = user["claims"] as Record<string, unknown>;
    res.json({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    });
  });

  app.use("/api", (req, res, next) => {
    if (req.path === "/healthz" || req.path === "/login" || req.path === "/callback" || req.path === "/logout") {
      return next();
    }
    return isAuthenticated(req, res, next);
  });

  app.use("/api", router);

  return app;
}

export default app;
