import { pgTable, text, serial, integer, boolean, timestamp, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

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

export const supplementReference = pgTable("supplement_reference", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertHealthStatsSchema = createInsertSchema(healthStats);
export const selectHealthStatsSchema = createSelectSchema(healthStats);
export const insertSupplementSchema = createInsertSchema(supplements);
export const selectSupplementSchema = createSelectSchema(supplements);
export const insertSupplementLogSchema = createInsertSchema(supplementLogs);
export const selectSupplementLogSchema = createSelectSchema(supplementLogs);

export const insertSupplementReferenceSchema = createInsertSchema(supplementReference);
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

export const selectSupplementReferenceSchema = createSelectSchema(supplementReference);

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