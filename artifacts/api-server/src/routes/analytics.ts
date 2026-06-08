import { Router, type IRouter } from "express";
import { db, tradesTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/trades/equity-curve", async (req, res): Promise<void> => {
  const days = parseInt((req.query.days as string) ?? "90");
  const trades = await db
    .select({
      date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`,
      pnl: tradesTable.pnl,
    })
    .from(tradesTable)
    .where(sql`created_at >= now() - (${days} || ' days')::interval AND result != 'Open'`)
    .orderBy(tradesTable.createdAt);

  let cum = 0;
  const grouped: Record<string, number> = {};
  for (const t of trades) {
    const d = t.date;
    grouped[d] = (grouped[d] ?? 0) + (t.pnl ?? 0);
  }

  const points = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => {
      cum += pnl;
      return { date, cumPnlR: parseFloat(cum.toFixed(2)) };
    });

  res.json(points);
});

router.get("/trades/session-performance", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      session: tradesTable.session,
      total: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where result = 'Win')::int`,
    })
    .from(tradesTable)
    .where(sql`result != 'Open'`)
    .groupBy(tradesTable.session);

  const result = rows.map((r) => ({
    session: r.session,
    trades: r.total,
    winRate: r.total > 0 ? parseFloat(((r.wins / r.total) * 100).toFixed(1)) : 0,
  }));

  res.json(result);
});

router.get("/trades/pair-performance", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      symbol: tradesTable.symbol,
      total: sql<number>`count(*)::int`,
      pnlR: sql<number>`coalesce(sum(pnl), 0)::float`,
    })
    .from(tradesTable)
    .where(sql`result != 'Open'`)
    .groupBy(tradesTable.symbol)
    .orderBy(desc(sql`coalesce(sum(pnl), 0)`));

  const result = rows.map((r) => ({
    pair: r.symbol,
    trades: r.total,
    pnlR: parseFloat(r.pnlR.toFixed(2)),
  }));

  res.json(result);
});

export default router;
