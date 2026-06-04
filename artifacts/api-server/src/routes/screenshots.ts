import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tradeScreenshotsTable } from "@workspace/db";
import { CreateScreenshotBody, DeleteScreenshotParams } from "@workspace/api-zod";

const router: IRouter = Router();

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

router.post("/trade-screenshots", async (req, res): Promise<void> => {
  const parsed = CreateScreenshotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user?.id;
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

  const userId = req.user?.id;
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

  res.sendStatus(204);
});

export default router;
