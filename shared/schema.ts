import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const buttonOwnerships = pgTable("button_ownerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerAddress: text("owner_address").notNull(),
  txHash: text("tx_hash").notNull().unique(),
  startsAt: timestamp("starts_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(3600),
  buttonColor: text("button_color"),
  buttonEmoji: text("button_emoji"),
  buttonImageUrl: text("button_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const links = pgTable("links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownershipId: varchar("ownership_id").references(() => buttonOwnerships.id),
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

export const insertButtonOwnershipSchema = createInsertSchema(buttonOwnerships).omit({
  id: true,
  startsAt: true,
  expiresAt: true,
  createdAt: true,
}).extend({
  ownerAddress: z.string().min(1, "Owner address required"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  durationSeconds: z.number().int().positive().default(3600),
});

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  createdAt: true,
}).extend({
  url: z.string().url("Please enter a valid URL").refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Only http:// and https:// URLs are allowed" }
  ),
  submittedBy: z.string().min(1, "Submitter address required"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
});

export const updateLinkSchema = z.object({
  url: z.string().url("Please enter a valid URL").refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Only http:// and https:// URLs are allowed" }
  ),
});

export const updateOwnershipVisualsSchema = z.object({
  buttonColor: z.string().optional(),
  buttonEmoji: z.string().optional(),
  buttonImageUrl: z.string().url().refine(
    (url) => {
      if (!url) return true;
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Only http:// and https:// URLs are allowed" }
  ).optional(),
}).refine(
  (data) => {
    const hasImage = !!data.buttonImageUrl;
    const hasColorOrEmoji = !!data.buttonColor || !!data.buttonEmoji;
    return !hasImage || !hasColorOrEmoji;
  },
  {
    message: "Cannot set image with color or emoji. Choose image OR color/emoji.",
  }
);

export type UpdateOwnershipVisuals = z.infer<typeof updateOwnershipVisualsSchema>;

export const insertClickSchema = createInsertSchema(clicks).omit({
  id: true,
  clickedAt: true,
});

export type InsertButtonOwnership = z.infer<typeof insertButtonOwnershipSchema>;
export type ButtonOwnership = typeof buttonOwnerships.$inferSelect;
export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Link = typeof links.$inferSelect;
export type UpdateLink = z.infer<typeof updateLinkSchema>;
export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicks.$inferSelect;
