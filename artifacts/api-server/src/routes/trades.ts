import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, tradesTable } from "@workspace/db";
import {
  ListTradesQueryParams,
  CreateTradeBody,
  GetTradeParams,
  UpdateTradeParams,
  UpdateTradeBody,
  DeleteTradeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/trades", async (req, res): Promise<void> => {
  const query = ListTradesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(tradesTable).$dynamic();

  if (query.data.symbol) {
    dbQuery = dbQuery.where(eq(tradesTable.symbol, query.data.symbol));
  }
  if (query.data.result) {
    dbQuery = dbQuery.where(eq(tradesTable.result, query.data.result));
  }
  if (query.data.session) {
    dbQuery = dbQuery.where(eq(tradesTable.session, query.data.session));
  }

  const trades = await dbQuery.orderBy(desc(tradesTable.createdAt));
  res.json(trades);
});

router.post("/trades", async (req, res): Promise<void> => {
  const parsed = CreateTradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [trade] = await db.insert(tradesTable).values(parsed.data).returning();
  res.status(201).json(trade);
});

router.get("/trades/stats", async (req, res): Promise<void> => {
  const [overall] = await db
    .select({
      total: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where result = 'Win')::int`,
      losses: sql<number>`count(*) filter (where result = 'Loss')::int`,
      totalPnl: sql<number>`coalesce(sum(pnl), 0)::float`,
      avgRisk: sql<number>`coalesce(avg(risk_percent), 0)::float`,
      bestTrade: sql<number | null>`max(pnl)::float`,
      worstTrade: sql<number | null>`min(pnl)::float`,
    })
    .from(tradesTable);

  const bySymbolRows = await db
    .select({
      symbol: tradesTable.symbol,
      count: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where result = 'Win')::int`,
      pnl: sql<number>`coalesce(sum(pnl), 0)::float`,
    })
    .from(tradesTable)
    .groupBy(tradesTable.symbol);

  const bySetupRows = await db
    .select({
      setupType: tradesTable.setupType,
      count: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where result = 'Win')::int`,
    })
    .from(tradesTable)
    .groupBy(tradesTable.setupType);

  const totalTrades = overall?.total ?? 0;
  const wins = overall?.wins ?? 0;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  res.json({
    totalTrades,
    wins,
    losses: overall?.losses ?? 0,
    winRate: Math.round(winRate * 10) / 10,
    totalPnl: overall?.totalPnl ?? 0,
    avgRisk: Math.round((overall?.avgRisk ?? 0) * 100) / 100,
    bestTrade: overall?.bestTrade ?? null,
    worstTrade: overall?.worstTrade ?? null,
    bySymbol: bySymbolRows.map((r) => ({
      symbol: r.symbol,
      count: r.count,
      winRate: r.count > 0 ? Math.round((r.wins / r.count) * 1000) / 10 : 0,
      pnl: r.pnl,
    })),
    bySetup: bySetupRows.map((r) => ({
      setupType: r.setupType,
      count: r.count,
      winRate: r.count > 0 ? Math.round((r.wins / r.count) * 1000) / 10 : 0,
    })),
  });
});

router.get("/trades/:id", async (req, res): Promise<void> => {
  const params = GetTradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [trade] = await db
    .select()
    .from(tradesTable)
    .where(eq(tradesTable.id, params.data.id));

  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }

  res.json(trade);
});

router.patch("/trades/:id", async (req, res): Promise<void> => {
  const params = UpdateTradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [trade] = await db
    .update(tradesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(tradesTable.id, params.data.id))
    .returning();

  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }

  res.json(trade);
});

router.delete("/trades/:id", async (req, res): Promise<void> => {
  const params = DeleteTradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [trade] = await db
    .delete(tradesTable)
    .where(eq(tradesTable.id, params.data.id))
    .returning();

  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
