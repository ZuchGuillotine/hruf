
import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Supplement logs for tracking daily intake
export const supplementLogs = pgTable("supplement_logs", {
  id: serial("id").primaryKey(),
  supplementId: integer("supplement_id").notNull(),
  userId: integer("user_id").notNull(),
  takenAt: timestamp("taken_at").default(sql`CURRENT_TIMESTAMP`),
  notes: text("notes"),
  effects: json("effects").$type<{
    mood?: number;
    energy?: number;
    sleep?: number;
    sideEffects?: string[];
  }>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Chat and AI interaction logs
export const qualitativeLogs = pgTable("qualitative_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  loggedAt: timestamp("logged_at").default(sql`CURRENT_TIMESTAMP`),
  type: text("type"),
  tags: json("tags").$type<string[]>(),
  sentimentScore: integer("sentiment_score"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Reference table for supplement autocomplete
export const supplementReference = pgTable("supplement_reference", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Zod schemas
export const insertSupplementLogSchema = createInsertSchema(supplementLogs);
export const selectSupplementLogSchema = createSelectSchema(supplementLogs);
export const insertQualitativeLogSchema = createInsertSchema(qualitativeLogs);
export const selectQualitativeLogSchema = createSelectSchema(qualitativeLogs);
export const insertSupplementReferenceSchema = createInsertSchema(supplementReference);
export const selectSupplementReferenceSchema = createSelectSchema(supplementReference);

// TypeScript types
export type InsertSupplementLog = typeof supplementLogs.$inferInsert;
export type SelectSupplementLog = typeof supplementLogs.$inferSelect;
export type InsertQualitativeLog = typeof qualitativeLogs.$inferInsert;
export type SelectQualitativeLog = typeof qualitativeLogs.$inferSelect;
export type InsertSupplementReference = typeof supplementReference.$inferInsert;
export type SelectSupplementReference = typeof supplementReference.$inferSelect;

// Export the schema
export const rdsSchema = {
  supplementLogs,
  qualitativeLogs,
  supplementReference,
};