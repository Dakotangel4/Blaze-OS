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
  const finnhubApiKey =
    typeof body.finnhubApiKey === "string" ? body.finnhubApiKey || null
    : body.finnhubApiKey === null ? null
    : undefined;

  if (finnhubApiKey === undefined) {
    res.status(400).json({ error: "finnhubApiKey must be a string or null" });
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
      .values({ finnhubApiKey })
      .returning();
    res.json(created);
    return;
  }

  const [updated] = await db
    .update(userSettingsTable)
    .set({ finnhubApiKey, updatedAt: new Date() })
    .where(sql`id = ${existing.id}`)
    .returning();

  res.json(updated);
});

export default router;
