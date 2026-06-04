import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { db, tradeScreenshotsTable } from "@workspace/db";
import { CreateScreenshotBody, DeleteScreenshotParams } from "@workspace/api-zod";
import { supabaseAdmin } from "../utils/supabaseAuth";

const router: IRouter = Router();

const SCREENSHOTS_BUCKET = "trade-screenshots";

function getUserId(req: Request): string | undefined {
  return req.supabaseUser?.id;
}

// GET /api/trade-screenshots?tradeId=X
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

// POST /api/trade-screenshots
// Body: { tradeId, imageUrl, imagePath, imageType }
// The frontend uploads directly to Supabase Storage, then calls this to persist metadata.
router.post("/trade-screenshots", async (req, res): Promise<void> => {
  const parsed = CreateScreenshotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getUserId(req);
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

// DELETE /api/trade-screenshots/:id
// Deletes the DB record and removes the file from Supabase Storage.
router.delete("/trade-screenshots/:id", async (req, res): Promise<void> => {
  const params = DeleteScreenshotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = getUserId(req);
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
  // imagePath stores the Supabase Storage object path (not a full URL)
  if (deleted.imagePath && !deleted.imagePath.startsWith("http")) {
    await supabaseAdmin.storage
      .from(SCREENSHOTS_BUCKET)
      .remove([deleted.imagePath])
      .catch(() => {}); // non-fatal — file may already be gone
  }
  res.sendStatus(204);
});

export default router;
