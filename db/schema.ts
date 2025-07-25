import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, numeric, vector } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from 'zod';

// User account management and authentication
export const users = pgTable("users", {
  // Subscription-related fields
  subscriptionId: text("subscription_id"),
  subscriptionTier: text("subscription_tier").default('free').notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  
  // Usage limits and counters
  aiInteractionsCount: integer("ai_interactions_count").default(0),
  aiInteractionsReset: timestamp("ai_interactions_reset"),
  labUploadsCount: integer("lab_uploads_count").default(0),
  labUploadsReset: timestamp("lab_uploads_reset"),
  lastRewardedAt: timestamp("last_rewarded_at"),
  
  // Core user fields
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  name: text("name"),
  phoneNumber: text("phone_number"),
  isAdmin: boolean("is_admin").default(false),
  
  // Email verification
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry", { mode: 'date' }),
  
  // Timestamps
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// User health profile and statistics
export const healthStats = pgTable("health_stats", {
  userId: integer("user_id").references(() => users.id).primaryKey(),
  weight: numeric("weight"),
  height: numeric("height"), // stored in centimeters
  gender: text("gender"),
  ethnicity: text("ethnicity"),
  dateOfBirth: date("date_of_birth", { mode: 'date' }),
  averageSleep: integer("average_sleep"), // Stored in minutes
  profilePhotoUrl: text("profile_photo_url"),
  allergies: text("allergies"),
  lastUpdated: timestamp("last_updated", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Primary supplement tracking table
export const supplements = pgTable("supplements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  notes: text("notes"),
  active: boolean("active").default(true),
  startDate: timestamp("start_date", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Supplement tracking logs
export const supplementLogs = pgTable("supplement_logs", {
  id: serial("id").primaryKey(),
  supplementId: integer("supplement_id").references(() => supplements.id),
  userId: integer("user_id").references(() => users.id),
  takenAt: timestamp("taken_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  notes: text("notes"),
  effects: jsonb("effects").$type<{
    mood?: number;
    energy?: number;
    sleep?: number;
    sideEffects?: string[];
  }>(),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Reference table for supplement names and categories
export const supplementReference = pgTable("supplement_reference", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  category: text("category").notNull().default('General'),
  alternativeNames: text("alternative_names").array(),
  description: text("description"),
  source: text("source"),
  sourceUrl: text("source_url"),
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
export const qualitativeLogs = pgTable("qualitative_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  loggedAt: timestamp("logged_at").default(sql`CURRENT_TIMESTAMP`),
  type: text("type").notNull(),
  tags: jsonb("tags").$type<string[]>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Query chat logs
export const queryChatLogs = pgTable("query_chat_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  loggedAt: timestamp("logged_at").default(sql`CURRENT_TIMESTAMP`),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
});

// Biomarker results storage
export const biomarkerResults = pgTable("biomarker_results", {
  id: serial("id").primaryKey(),
  labResultId: integer("lab_result_id").references(() => labResults.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  value: numeric("value").notNull(),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
  referenceRange: text("reference_range"),
  testDate: timestamp("test_date").notNull(),
  status: text("status"),
  extractionMethod: text("extraction_method").notNull(),
  confidence: numeric("confidence"),
  metadata: jsonb("metadata").$type<{
    sourceText?: string;
    extractionTimestamp?: string;
    validationStatus?: string;
    notes?: string;
  }>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const biomarkerProcessingStatus = pgTable("biomarker_processing_status", {
  labResultId: integer("lab_result_id").references(() => labResults.id, { onDelete: "cascade" }).primaryKey(),
  status: text("status").notNull(),
  extractionMethod: text("extraction_method"),
  biomarkerCount: integer("biomarker_count"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").$type<{
    regexMatches?: number;
    llmExtractions?: number;
    processingTime?: number;
    retryCount?: number;
    textLength?: number;
    errorDetails?: string;
    biomarkerCount?: number;
    source?: string;
  }>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const biomarkerReference = pgTable("biomarker_reference", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  defaultUnit: text("default_unit").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<{
    commonNames?: string[];
    normalRanges?: {
      gender?: string;
      ageRange?: string;
      range: string;
      unit: string;
    }[];
    importance?: number;
  }>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Add type definitions for biomarker tables
export type InsertBiomarkerResult = typeof biomarkerResults.$inferInsert;
export type SelectBiomarkerResult = typeof biomarkerResults.$inferSelect;
export type InsertBiomarkerProcessingStatus = typeof biomarkerProcessingStatus.$inferInsert;
export type SelectBiomarkerProcessingStatus = typeof biomarkerProcessingStatus.$inferSelect;
export type InsertBiomarkerReference = typeof biomarkerReference.$inferInsert;
export type SelectBiomarkerReference = typeof biomarkerReference.$inferSelect;

// Add Zod schemas for biomarker tables
export const insertBiomarkerResultSchema = createInsertSchema(biomarkerResults);
export const selectBiomarkerResultSchema = createSelectSchema(biomarkerResults);
export const insertBiomarkerProcessingStatusSchema = createInsertSchema(biomarkerProcessingStatus);
export const selectBiomarkerProcessingStatusSchema = createSelectSchema(biomarkerProcessingStatus);
export const insertBiomarkerReferenceSchema = createInsertSchema(biomarkerReference);
export const selectBiomarkerReferenceSchema = createSelectSchema(biomarkerReference);


// Zod schemas for type-safe database operations

export const insertUserSchema = createInsertSchema(users).extend({
  // Add optional fields for Stripe integration that aren't in the database schema
  stripeSessionId: z.string().optional(),
  purchaseIdentifier: z.string().optional(),
});
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

// Lab results storage
export const labResults = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<{
    size: number;
    lastViewed?: string;
    tags?: string[];
    parsedText?: string;
    parseDate?: string;
    ocr?: {
      text: string;
      processedAt: string;
      confidence: number;
      engineVersion: string;
      parameters: Record<string, unknown>;
    };
    extractedText?: string;
    extractionMethod?: string;
    extractionDate?: string;
    summary?: string;
    summarizedAt?: string;
    preprocessedText?: {
      rawText: string;
      normalizedText: string;
      processingMetadata: {
        originalFormat: string;
        processingSteps: string[];
        confidence?: number;
        ocrEngine?: string;
        processingTimestamp: string;
        textLength: number;
        lineCount: number;
        hasHeaders: boolean;
        hasFooters: boolean;
        qualityMetrics?: {
          whitespaceRatio: number;
          specialCharRatio: number;
          numericRatio: number;
          potentialOcrErrors: number;
        };
      };
    };
    biomarkers?: {
      parsedBiomarkers: Array<{
        name: string;
        value: number;
        unit: string;
        referenceRange?: string;
        testDate?: string;
        category?: string;
      }>;
      parsingErrors: string[];
      extractedAt: string;
    };
  }>(),
});

// TypeScript type definitions for database operations
export type InsertLabResult = typeof labResults.$inferInsert;
export type SelectLabResult = typeof labResults.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
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
// Chat summary storage
export const chatSummaries = pgTable("chat_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  summary: text("summary").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type SelectQualitativeLog = typeof qualitativeLogs.$inferSelect;
// Research document storage
export const researchDocuments = pgTable("research_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  imageUrls: jsonb("image_urls").$type<string[]>().default(sql`'[]'::jsonb`),
  publishedAt: timestamp("published_at").default(sql`CURRENT_TIMESTAMP`),
  authors: text("authors").notNull(),
  tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// General query chat storage
export const queryChats = pgTable("query_chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  messages: jsonb("messages").$type<Array<{role: string, content: string}>>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
});

// Create Zod schemas for research documents and query chats
export const insertResearchDocumentSchema = createInsertSchema(researchDocuments);
export const selectResearchDocumentSchema = createSelectSchema(researchDocuments);
export const insertQueryChatSchema = createInsertSchema(queryChats);
export const selectQueryChatSchema = createSelectSchema(queryChats);

export type InsertChatSummary = typeof chatSummaries.$inferInsert;
export type SelectChatSummary = typeof chatSummaries.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
export type ResearchDocument = typeof researchDocuments.$inferSelect;
export type InsertResearchDocument = typeof researchDocuments.$inferInsert;
export type InsertQueryChat = typeof queryChats.$inferInsert;
export type SelectQueryChat = typeof queryChats.$inferSelect;

// Log embeddings for vector search
export const logEmbeddings = pgTable("log_embeddings", {
  id: serial("id").primaryKey(),
  logId: integer("log_id").notNull(),
  logType: text("log_type").notNull(), // 'qualitative' or 'quantitative'
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Summary embeddings for vector search 
export const summaryEmbeddings = pgTable("summary_embeddings", {
  id: serial("id").primaryKey(),
  summaryId: integer("summary_id").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Add log summaries table for storing summarized content
export const logSummaries = pgTable("log_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  summaryType: text("summary_type").notNull(), // 'daily', 'weekly', etc.
  startDate: timestamp("start_date", { mode: 'date' }).notNull(),
  endDate: timestamp("end_date", { mode: 'date' }).notNull(),
  metadata: jsonb("metadata").$type<{
    supplementCount: number;
    qualitativeLogCount: number;
    quantitativeLogCount: number;
    significantChanges: string[];
    dailySummaryCount?: number; // Only present for weekly summaries
  }>().default({
    supplementCount: 0,
    qualitativeLogCount: 0,
    quantitativeLogCount: 0,
    significantChanges: []
  }),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Add type definitions for the new tables
export type InsertLogEmbedding = typeof logEmbeddings.$inferInsert;
export type SelectLogEmbedding = typeof logEmbeddings.$inferSelect;
export type InsertSummaryEmbedding = typeof summaryEmbeddings.$inferInsert;
export type SelectSummaryEmbedding = typeof summaryEmbeddings.$inferSelect;
export type InsertLogSummary = typeof logSummaries.$inferInsert;
export type SelectLogSummary = typeof logSummaries.$inferSelect;