import { boolean, numeric, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accountStatusEnum = pgEnum("account_status", ["ACTIVE", "PASSED", "FAILED", "FUNDED"]);

export const accountsTable = pgTable("prop_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  firm: text("firm").notNull(),
  accountSize: numeric("account_size", { precision: 14, scale: 2 }).notNull(),
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 }).notNull(),
  dailyDrawdownLimit: numeric("daily_drawdown_limit", { precision: 6, scale: 2 }).notNull(),
  maxDrawdownLimit: numeric("max_drawdown_limit", { precision: 6, scale: 2 }).notNull(),
  profitTarget: numeric("profit_target", { precision: 6, scale: 2 }).notNull(),
  trailingDrawdown: boolean("trailing_drawdown").notNull().default(false),
  status: accountStatusEnum("status").notNull().default("ACTIVE"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAccountSchema = createInsertSchema(accountsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accountsTable.$inferSelect;
