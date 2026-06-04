import { Router, type IRouter } from "express";
import { sql, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { userSettingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/settings", async (req, res): Promise<void> => {
  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .orderBy(desc(userSettingsTable.id))
    .limit(1);

  if (!settings) {
    const [created] = await db
      .insert(userSettingsTable)
      .values({ finnhubApiKey: null })
      .returning();
    res.json(created);
    return;
  }

  res.json(settings);
});

router.put("/settings", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  function pickKey(val: unknown): string | null | undefined {
    if (typeof val === "string") return val || null;
    if (val === null) return null;
    return undefined;
  }

  const finnhubApiKey = pickKey(body.finnhubApiKey);
  const openaiApiKey = pickKey(body.openaiApiKey);
  const claudeApiKey = pickKey(body.claudeApiKey);
  const perplexityApiKey = pickKey(body.perplexityApiKey);

  const patch: Record<string, string | null | Date> = { updatedAt: new Date() };
  if (finnhubApiKey !== undefined) patch.finnhubApiKey = finnhubApiKey;
  if (openaiApiKey !== undefined) patch.openaiApiKey = openaiApiKey;
  if (claudeApiKey !== undefined) patch.claudeApiKey = claudeApiKey;
  if (perplexityApiKey !== undefined) patch.perplexityApiKey = perplexityApiKey;

  if (Object.keys(patch).length === 1) {
    res.status(400).json({ error: "No valid fields provided" });
    return;
  }

  const [existing] = await db
    .select()
    .from(userSettingsTable)
    .orderBy(desc(userSettingsTable.id))
    .limit(1);

  if (!existing) {
    const [created] = await db
      .insert(userSettingsTable)
      .values({ finnhubApiKey: finnhubApiKey ?? null })
      .returning();
    res.json(created);
    return;
  }

  const [updated] = await db
    .update(userSettingsTable)
    .set(patch)
    .where(sql`id = ${existing.id}`)
    .returning();

  res.json(updated);
});

export default router;
