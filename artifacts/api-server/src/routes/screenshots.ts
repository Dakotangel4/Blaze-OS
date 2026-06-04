import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, tradeScreenshotsTable } from "@workspace/db";
import { CreateScreenshotBody, DeleteScreenshotParams } from "@workspace/api-zod";

const router: IRouter = Router();

const uploadsDir = path.join(process.cwd(), "uploads", "screenshots");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

function getUserId(req: Express.Request): string | undefined {
  const user = (req as unknown as { user?: Record<string, unknown> }).user;
  const claims = user?.["claims"] as Record<string, unknown> | undefined;
  return claims?.["sub"] as string | undefined;
}

router.get("/trade-screenshots", async (req, res): Promise<void> => {
  const tradeId = Number(req.query.tradeId);
  if (!tradeId || isNaN(tradeId)) {
    res.status(400).json({ error: "tradeId query param is required" });
    return;
  }

  const screenshots = await db
    .select()
    .from(tradeScreenshotsTable)
    .where(eq(tradeScreenshotsTable.tradeId, tradeId))
    .orderBy(tradeScreenshotsTable.createdAt);

  res.json(screenshots);
});

router.post(
  "/trade-screenshots/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    const userId = getUserId(req as unknown as Express.Request);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const tradeId = Number(req.body.tradeId);
    const imageType = req.body.imageType as string;

    if (!tradeId || isNaN(tradeId)) {
      res.status(400).json({ error: "tradeId is required" });
      return;
    }
    if (!["before", "during", "after"].includes(imageType)) {
      res.status(400).json({ error: "imageType must be before, during, or after" });
      return;
    }

    const imagePath = req.file.filename;
    const imageUrl = `/api/trade-screenshots/file/${imagePath}`;

    const [screenshot] = await db
      .insert(tradeScreenshotsTable)
      .values({ tradeId, userId, imageUrl, imagePath, imageType })
      .returning();

    res.status(201).json(screenshot);
  },
);

router.get("/trade-screenshots/file/:filename", (req, res): void => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filePath);
});

router.post("/trade-screenshots", async (req, res): Promise<void> => {
  const parsed = CreateScreenshotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = getUserId(req as unknown as Express.Request);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [screenshot] = await db
    .insert(tradeScreenshotsTable)
    .values({ ...parsed.data, userId })
    .returning();

  res.status(201).json(screenshot);
});

router.delete("/trade-screenshots/:id", async (req, res): Promise<void> => {
  const params = DeleteScreenshotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = getUserId(req as unknown as Express.Request);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [deleted] = await db
    .delete(tradeScreenshotsTable)
    .where(eq(tradeScreenshotsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Screenshot not found" });
    return;
  }

  if (deleted.imagePath && !deleted.imagePath.startsWith("http")) {
    const filePath = path.join(uploadsDir, path.basename(deleted.imagePath));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  res.sendStatus(204);
});

export default router;
