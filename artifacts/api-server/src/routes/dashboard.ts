import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  tradesTable,
  clientsTable,
  notesTable,
  calendarEventsTable,
  financesTable,
  dailyBiasTable,
} from "@workspace/db";
import {
  UpdateDailyBiasBody,
} from "@workspace/api-zod";
import { sql, desc, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const [tradeStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      wins: sql<number>`count(*) filter (where result = 'Win')::int`,
      totalPnl: sql<number>`coalesce(sum(pnl), 0)::float`,
    })
    .from(tradesTable);

  const [clientCount] = await db
    .select({ open: sql<number>`count(*)::int` })
    .from(clientsTable)
    .where(sql`status not in ('Completed', 'Paid')`);

  const [noteCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(notesTable);

  const [eventCount] = await db
    .select({ upcoming: sql<number>`count(*)::int` })
    .from(calendarEventsTable);

  const [monthFinance] = await db
    .select({
      revenue: sql<number>`coalesce(sum(case when type = 'income' then amount else 0 end), 0)::float`,
    })
    .from(financesTable)
    .where(
      sql`month = to_char(now(), 'YYYY-MM')`,
    );

  const recentTrades = await db
    .select()
    .from(tradesTable)
    .orderBy(desc(tradesTable.createdAt))
    .limit(5);

  const totalTrades = tradeStats?.total ?? 0;
  const wins = tradeStats?.wins ?? 0;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  res.json({
    totalTrades,
    winRate: Math.round(winRate * 10) / 10,
    totalPnl: tradeStats?.totalPnl ?? 0,
    openClients: clientCount?.open ?? 0,
    totalNotes: noteCount?.total ?? 0,
    upcomingEvents: eventCount?.upcoming ?? 0,
    monthlyRevenue: monthFinance?.revenue ?? 0,
    recentTrades,
  });
});

router.get("/dashboard/bias", async (req, res): Promise<void> => {
  const [bias] = await db
    .select()
    .from(dailyBiasTable)
    .orderBy(desc(dailyBiasTable.id))
    .limit(1);

  if (!bias) {
    const [created] = await db
      .insert(dailyBiasTable)
      .values({ direction: "Neutral" })
      .returning();
    res.json(created);
    return;
  }

  res.json(bias);
});

router.put("/dashboard/bias", async (req, res): Promise<void> => {
  const parsed = UpdateDailyBiasBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(dailyBiasTable)
    .orderBy(desc(dailyBiasTable.id))
    .limit(1);

  if (!existing) {
    const [created] = await db
      .insert(dailyBiasTable)
      .values(parsed.data)
      .returning();
    res.json(created);
    return;
  }

  const [updated] = await db
    .update(dailyBiasTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(sql`id = ${existing.id}`)
    .returning();

  res.json(updated);
});

export default router;
