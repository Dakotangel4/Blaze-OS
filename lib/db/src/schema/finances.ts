import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const financesTable = pgTable("finances", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  month: text("month").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFinanceSchema = createInsertSchema(financesTable).omit({ id: true, createdAt: true });
export type InsertFinance = z.infer<typeof insertFinanceSchema>;
export type Finance = typeof financesTable.$inferSelect;
