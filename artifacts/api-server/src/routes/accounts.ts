import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, accountsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/accounts", async (_req, res): Promise<void> => {
  const accounts = await db.select().from(accountsTable).orderBy(accountsTable.createdAt);
  res.json(accounts.map(serialize));
});

router.post("/accounts", async (req, res): Promise<void> => {
  const { name, firm, accountSize, currentBalance, dailyDrawdownLimit, maxDrawdownLimit, profitTarget, trailingDrawdown, status, notes } = req.body;
  if (!name || !firm || accountSize == null || currentBalance == null) {
    res.status(400).json({ error: "name, firm, accountSize, currentBalance required" });
    return;
  }
  const [account] = await db
    .insert(accountsTable)
    .values({
      name,
      firm,
      accountSize: accountSize.toString(),
      currentBalance: currentBalance.toString(),
      dailyDrawdownLimit: (dailyDrawdownLimit ?? 5).toString(),
      maxDrawdownLimit: (maxDrawdownLimit ?? 10).toString(),
      profitTarget: (profitTarget ?? 10).toString(),
      trailingDrawdown: trailingDrawdown ?? false,
      status: status ?? "ACTIVE",
      notes: notes ?? null,
    })
    .returning();
  res.status(201).json(serialize(account));
});

router.get("/accounts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, id));
  if (!account) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serialize(account));
});

router.patch("/accounts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, firm, accountSize, currentBalance, dailyDrawdownLimit, maxDrawdownLimit, profitTarget, trailingDrawdown, status, notes } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (firm !== undefined) updates.firm = firm;
  if (accountSize !== undefined) updates.accountSize = accountSize.toString();
  if (currentBalance !== undefined) updates.currentBalance = currentBalance.toString();
  if (dailyDrawdownLimit !== undefined) updates.dailyDrawdownLimit = dailyDrawdownLimit.toString();
  if (maxDrawdownLimit !== undefined) updates.maxDrawdownLimit = maxDrawdownLimit.toString();
  if (profitTarget !== undefined) updates.profitTarget = profitTarget.toString();
  if (trailingDrawdown !== undefined) updates.trailingDrawdown = trailingDrawdown;
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  const [account] = await db.update(accountsTable).set(updates).where(eq(accountsTable.id, id)).returning();
  if (!account) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serialize(account));
});

router.delete("/accounts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(accountsTable).where(eq(accountsTable.id, id));
  res.status(204).send();
});

function serialize(a: typeof accountsTable.$inferSelect) {
  return {
    id: a.id,
    name: a.name,
    firm: a.firm,
    accountSize: parseFloat(a.accountSize),
    currentBalance: parseFloat(a.currentBalance),
    dailyDrawdownLimit: parseFloat(a.dailyDrawdownLimit),
    maxDrawdownLimit: parseFloat(a.maxDrawdownLimit),
    profitTarget: parseFloat(a.profitTarget),
    trailingDrawdown: a.trailingDrawdown,
    status: a.status,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
  };
}

export default router;
