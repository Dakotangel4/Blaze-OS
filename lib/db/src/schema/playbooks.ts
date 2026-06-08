import { integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playbooksTable = pgTable("playbooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rules: text("rules").notNull(),
  minRR: numeric("min_rr", { precision: 5, scale: 2 }),
  totalTrades: integer("total_trades").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  winRate: numeric("win_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlaybookSchema = createInsertSchema(playbooksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalTrades: true,
  wins: true,
  losses: true,
  winRate: true,
});
export type InsertPlaybook = z.infer<typeof insertPlaybookSchema>;
export type Playbook = typeof playbooksTable.$inferSelect;
