import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, calendarEventsTable } from "@workspace/db";
import {
  ListCalendarEventsQueryParams,
  CreateCalendarEventBody,
  UpdateCalendarEventParams,
  UpdateCalendarEventBody,
  DeleteCalendarEventParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/calendar", async (req, res): Promise<void> => {
  const query = ListCalendarEventsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(calendarEventsTable).$dynamic();

  if (query.data.impact) {
    dbQuery = dbQuery.where(eq(calendarEventsTable.impact, query.data.impact));
  }
  if (query.data.currency) {
    dbQuery = dbQuery.where(eq(calendarEventsTable.currency, query.data.currency));
  }

  const events = await dbQuery.orderBy(calendarEventsTable.eventTime);
  res.json(events);
});

router.post("/calendar", async (req, res): Promise<void> => {
  const parsed = CreateCalendarEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db
    .insert(calendarEventsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(event);
});

router.patch("/calendar/:id", async (req, res): Promise<void> => {
  const params = UpdateCalendarEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCalendarEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db
    .update(calendarEventsTable)
    .set(parsed.data)
    .where(eq(calendarEventsTable.id, params.data.id))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(event);
});

router.delete("/calendar/:id", async (req, res): Promise<void> => {
  const params = DeleteCalendarEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .delete(calendarEventsTable)
    .where(eq(calendarEventsTable.id, params.data.id))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
