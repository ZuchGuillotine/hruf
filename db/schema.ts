// Core database schema definitions for the supplement tracking application
import { pgTable, text, serial, integer, boolean, timestamp, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// User account management and authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  name: text("name"),
  phoneNumber: text("phone_number"),
  isPro: boolean("is_pro").default(false),
  isAdmin: boolean("is_admin").default(false),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// User health profile and statistics
export const healthStats = pgTable("health_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  weight: integer("weight"),
  dateOfBirth: date("date_of_birth"),
  averageSleep: integer("average_sleep"),
  profilePhotoUrl: text("profile_photo_url"),
  allergies: json("allergies").$type<string[]>(),
  lastUpdated: timestamp("last_updated").default(sql`CURRENT_TIMESTAMP`),
});

// Primary supplement tracking table - Stores user's active supplements
// This table is in the main database and links to the external RDS for logs
export const supplements = pgTable("supplements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  notes: text("notes"),
  active: boolean("active").default(true),
  startDate: timestamp("start_date").default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Supplement tracking logs - This schema is mirrored in the external RDS database
// Used for storing detailed supplement intake history and effects
export const supplementLogs = pgTable("supplement_logs", {
  id: serial("id").primaryKey(),
  supplementId: integer("supplement_id").references(() => supplements.id),
  userId: integer("user_id").references(() => users.id),
  takenAt: timestamp("taken_at").default(sql`CURRENT_TIMESTAMP`),
  notes: text("notes"),
  effects: json("effects").$type<{
    mood?: number;
    energy?: number;
    sleep?: number;
    sideEffects?: string[];
  }>(),
});

// Reference table for supplement names and categories
// Used by the autocomplete feature when users search for supplements
// This is in the main database and powers the Trie-based search functionality
export const supplementReference = pgTable("supplement_reference", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Blog content management
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  publishedAt: timestamp("published_at").default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Qualitative user logs for AI interactions and general notes
// Stored in the external RDS database for better scalability
export const qualitativeLogs = pgTable("qualitative_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  loggedAt: timestamp("logged_at").default(sql`CURRENT_TIMESTAMP`),
  type: text("type"),
  tags: json("tags").$type<string[]>(),
  sentimentScore: integer("sentiment_score"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
});

// Zod schemas for type-safe database operations
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertHealthStatsSchema = createInsertSchema(healthStats);
export const selectHealthStatsSchema = createSelectSchema(healthStats);
export const insertSupplementSchema = createInsertSchema(supplements);
export const selectSupplementSchema = createSelectSchema(supplements);
export const insertSupplementLogSchema = createInsertSchema(supplementLogs);
export const selectSupplementLogSchema = createSelectSchema(supplementLogs);

export const insertSupplementReferenceSchema = createInsertSchema(supplementReference);
export const selectSupplementReferenceSchema = createSelectSchema(supplementReference);

export const insertQualitativeLogSchema = createInsertSchema(qualitativeLogs);
export const selectQualitativeLogSchema = createSelectSchema(qualitativeLogs);

// TypeScript type definitions for database operations
export type InsertUser = typeof users.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertHealthStats = typeof healthStats.$inferInsert;
export type SelectHealthStats = typeof healthStats.$inferSelect;
export type InsertSupplement = typeof supplements.$inferInsert;
export type SelectSupplement = typeof supplements.$inferSelect;
export type InsertSupplementLog = typeof supplementLogs.$inferInsert;
export type SelectSupplementLog = typeof supplementLogs.$inferSelect;
export type InsertSupplementReference = typeof supplementReference.$inferInsert;
export type SelectSupplementReference = typeof supplementReference.$inferSelect;

export type InsertQualitativeLog = typeof qualitativeLogs.$inferInsert;
export type SelectQualitativeLog = typeof qualitativeLogs.$inferSelect;