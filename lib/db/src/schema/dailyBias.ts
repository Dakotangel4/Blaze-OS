import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyBiasTable = pgTable("daily_bias", {
  id: serial("id").primaryKey(),
  direction: text("direction").notNull().default("Neutral"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDailyBiasSchema = createInsertSchema(dailyBiasTable).omit({ id: true, updatedAt: true });
export type InsertDailyBias = z.infer<typeof insertDailyBiasSchema>;
export type DailyBias = typeof dailyBiasTable.$inferSelect;
