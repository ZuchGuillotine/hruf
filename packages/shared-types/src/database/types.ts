import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from 'zod';
import {
  users,
  healthStats,
  supplements,
  supplementLogs,
  supplementReference,
  blogPosts,
  qualitativeLogs,
  queryChatLogs,
  labResults,
  biomarkerResults,
  biomarkerProcessingStatus,
  biomarkerReference,
  chatSummaries,
  researchDocuments,
  queryChats,
  logEmbeddings,
  summaryEmbeddings,
  logSummaries
} from './schema.js';

// TypeScript type definitions for database operations
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
export type InsertBlogPost = typeof blogPosts.$inferInsert;
export type SelectBlogPost = typeof blogPosts.$inferSelect;
export type InsertQualitativeLog = typeof qualitativeLogs.$inferInsert;
export type SelectQualitativeLog = typeof qualitativeLogs.$inferSelect;
export type InsertQueryChatLog = typeof queryChatLogs.$inferInsert;
export type SelectQueryChatLog = typeof queryChatLogs.$inferSelect;
export type InsertLabResult = typeof labResults.$inferInsert;
export type SelectLabResult = typeof labResults.$inferSelect;
export type InsertBiomarkerResult = typeof biomarkerResults.$inferInsert;
export type SelectBiomarkerResult = typeof biomarkerResults.$inferSelect;
export type InsertBiomarkerProcessingStatus = typeof biomarkerProcessingStatus.$inferInsert;
export type SelectBiomarkerProcessingStatus = typeof biomarkerProcessingStatus.$inferSelect;
export type InsertBiomarkerReference = typeof biomarkerReference.$inferInsert;
export type SelectBiomarkerReference = typeof biomarkerReference.$inferSelect;
export type InsertChatSummary = typeof chatSummaries.$inferInsert;
export type SelectChatSummary = typeof chatSummaries.$inferSelect;
export type InsertResearchDocument = typeof researchDocuments.$inferInsert;
export type SelectResearchDocument = typeof researchDocuments.$inferSelect;
export type InsertQueryChat = typeof queryChats.$inferInsert;
export type SelectQueryChat = typeof queryChats.$inferSelect;
export type InsertLogEmbedding = typeof logEmbeddings.$inferInsert;
export type SelectLogEmbedding = typeof logEmbeddings.$inferSelect;
export type InsertSummaryEmbedding = typeof summaryEmbeddings.$inferInsert;
export type SelectSummaryEmbedding = typeof summaryEmbeddings.$inferSelect;
export type InsertLogSummary = typeof logSummaries.$inferInsert;
export type SelectLogSummary = typeof logSummaries.$inferSelect;

// Legacy type aliases for backward compatibility
export type BlogPost = SelectBlogPost;
export type ResearchDocument = SelectResearchDocument;
export type User = SelectUser;
export type HealthStats = SelectHealthStats;
export type Supplement = SelectSupplement;
export type LabResult = SelectLabResult;
export type BiomarkerResult = SelectBiomarkerResult;
export type QualitativeLog = SelectQualitativeLog;
export type QueryChatLog = SelectQueryChatLog;

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
export const insertBlogPostSchema = createInsertSchema(blogPosts);
export const selectBlogPostSchema = createSelectSchema(blogPosts);
export const insertQualitativeLogSchema = createInsertSchema(qualitativeLogs);
export const selectQualitativeLogSchema = createSelectSchema(qualitativeLogs);
export const insertQueryChatLogSchema = createInsertSchema(queryChatLogs);
export const selectQueryChatLogSchema = createSelectSchema(queryChatLogs);
export const insertLabResultSchema = createInsertSchema(labResults);
export const selectLabResultSchema = createSelectSchema(labResults);
export const insertBiomarkerResultSchema = createInsertSchema(biomarkerResults);
export const selectBiomarkerResultSchema = createSelectSchema(biomarkerResults);
export const insertBiomarkerProcessingStatusSchema = createInsertSchema(biomarkerProcessingStatus);
export const selectBiomarkerProcessingStatusSchema = createSelectSchema(biomarkerProcessingStatus);
export const insertBiomarkerReferenceSchema = createInsertSchema(biomarkerReference);
export const selectBiomarkerReferenceSchema = createSelectSchema(biomarkerReference);
export const insertChatSummarySchema = createInsertSchema(chatSummaries);
export const selectChatSummarySchema = createSelectSchema(chatSummaries);
export const insertResearchDocumentSchema = createInsertSchema(researchDocuments);
export const selectResearchDocumentSchema = createSelectSchema(researchDocuments);
export const insertQueryChatSchema = createInsertSchema(queryChats);
export const selectQueryChatSchema = createSelectSchema(queryChats);
export const insertLogEmbeddingSchema = createInsertSchema(logEmbeddings);
export const selectLogEmbeddingSchema = createSelectSchema(logEmbeddings);
export const insertSummaryEmbeddingSchema = createInsertSchema(summaryEmbeddings);
export const selectSummaryEmbeddingSchema = createSelectSchema(summaryEmbeddings);
export const insertLogSummarySchema = createInsertSchema(logSummaries);
export const selectLogSummarySchema = createSelectSchema(logSummaries);