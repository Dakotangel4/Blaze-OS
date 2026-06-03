import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, financesTable } from "@workspace/db";
import {
  ListFinancesQueryParams,
  CreateFinanceBody,
  UpdateFinanceParams,
  UpdateFinanceBody,
  DeleteFinanceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/finances", async (req, res): Promise<void> => {
  const query = ListFinancesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(financesTable).$dynamic();

  if (query.data.type) {
    dbQuery = dbQuery.where(eq(financesTable.type, query.data.type));
  }
  if (query.data.month) {
    dbQuery = dbQuery.where(eq(financesTable.month, query.data.month));
  }

  const entries = await dbQuery.orderBy(sql`created_at desc`);
  res.json(entries);
});

router.post("/finances", async (req, res): Promise<void> => {
  const parsed = CreateFinanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db.insert(financesTable).values(parsed.data).returning();
  res.status(201).json(entry);
});

router.get("/finances/summary", async (req, res): Promise<void> => {
  const all = await db.select().from(financesTable);

  const totalRevenue = all
    .filter((f) => f.type === "income")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalExpenses = all
    .filter((f) => f.type === "expense")
    .reduce((sum, f) => sum + f.amount, 0);

  const monthlyMap = new Map<string, { revenue: number; expenses: number }>();
  for (const f of all) {
    const existing = monthlyMap.get(f.month) ?? { revenue: 0, expenses: 0 };
    if (f.type === "income") existing.revenue += f.amount;
    else existing.expenses += f.amount;
    monthlyMap.set(f.month, existing);
  }

  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { revenue, expenses }]) => ({
      month,
      revenue,
      expenses,
      profit: revenue - expenses,
    }));

  const categoryMap = new Map<string, { total: number; type: string }>();
  for (const f of all) {
    const key = `${f.category}__${f.type}`;
    const existing = categoryMap.get(key) ?? { total: 0, type: f.type };
    existing.total += f.amount;
    categoryMap.set(key, existing);
  }

  const byCategory = Array.from(categoryMap.entries()).map(([key, val]) => ({
    category: key.split("__")[0],
    total: val.total,
    type: val.type,
  }));

  res.json({
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    monthlyBreakdown,
    byCategory,
  });
});

router.patch("/finances/:id", async (req, res): Promise<void> => {
  const params = UpdateFinanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFinanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .update(financesTable)
    .set(parsed.data)
    .where(eq(financesTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Finance entry not found" });
    return;
  }

  res.json(entry);
});

router.delete("/finances/:id", async (req, res): Promise<void> => {
  const params = DeleteFinanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(financesTable)
    .where(eq(financesTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Finance entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
