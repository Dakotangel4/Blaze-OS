import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tradesTable } from "./trades";

export const tradeScreenshotsTable = pgTable("trade_screenshots", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull().references(() => tradesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  imagePath: text("image_path").notNull(),
  imageType: text("image_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTradeScreenshotSchema = createInsertSchema(tradeScreenshotsTable).omit({ id: true, createdAt: true });
export type InsertTradeScreenshot = z.infer<typeof insertTradeScreenshotSchema>;
export type TradeScreenshot = typeof tradeScreenshotsTable.$inferSelect;
