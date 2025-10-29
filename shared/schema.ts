import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const links = pgTable("links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  submittedBy: text("submitted_by").notNull(),
  submitterUsername: text("submitter_username"),
  submitterPfpUrl: text("submitter_pfp_url"),
  txHash: text("tx_hash").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clicks = pgTable("clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").references(() => links.id),
  clickedBy: text("clicked_by"),
  clickerUsername: text("clicker_username"),
  clickerPfpUrl: text("clicker_pfp_url"),
  userAgent: text("user_agent"),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  createdAt: true,
}).extend({
  url: z.string().url("Please enter a valid URL"),
  submittedBy: z.string().min(1, "Submitter address required"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
});

export const insertClickSchema = createInsertSchema(clicks).omit({
  id: true,
  clickedAt: true,
});

export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Link = typeof links.$inferSelect;
export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicks.$inferSelect;
