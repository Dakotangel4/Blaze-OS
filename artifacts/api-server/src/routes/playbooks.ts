import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playbooksTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/playbooks", async (_req, res): Promise<void> => {
  const playbooks = await db.select().from(playbooksTable).orderBy(playbooksTable.createdAt);
  res.json(playbooks.map(serialize));
});

router.post("/playbooks", async (req, res): Promise<void> => {
  const { name, description, rules, minRR } = req.body;
  if (!name || !description || !rules) {
    res.status(400).json({ error: "name, description, and rules are required" });
    return;
  }
  const [playbook] = await db
    .insert(playbooksTable)
    .values({ name, description, rules, minRR: minRR?.toString() ?? null })
    .returning();
  res.status(201).json(serialize(playbook));
});

router.patch("/playbooks/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, description, rules, minRR } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (rules !== undefined) updates.rules = rules;
  if (minRR !== undefined) updates.minRR = minRR?.toString() ?? null;
  const [playbook] = await db
    .update(playbooksTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(playbooksTable.id, id))
    .returning();
  if (!playbook) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serialize(playbook));
});

router.delete("/playbooks/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(playbooksTable).where(eq(playbooksTable.id, id));
  res.status(204).send();
});

function serialize(p: typeof playbooksTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    rules: p.rules,
    minRR: p.minRR ? parseFloat(p.minRR) : null,
    totalTrades: p.totalTrades,
    wins: p.wins,
    losses: p.losses,
    winRate: p.winRate ? parseFloat(p.winRate) : null,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
