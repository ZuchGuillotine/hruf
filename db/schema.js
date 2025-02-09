"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectQualitativeLogSchema = exports.insertQualitativeLogSchema = exports.selectSupplementReferenceSchema = exports.insertSupplementReferenceSchema = exports.selectSupplementLogSchema = exports.insertSupplementLogSchema = exports.selectSupplementSchema = exports.insertSupplementSchema = exports.selectHealthStatsSchema = exports.insertHealthStatsSchema = exports.selectUserSchema = exports.insertUserSchema = exports.qualitativeLogs = exports.blogPosts = exports.supplementReference = exports.supplementLogs = exports.supplements = exports.healthStats = exports.users = void 0;
// Core database schema definitions for the supplement tracking application
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var drizzle_orm_1 = require("drizzle-orm");
// User account management and authentication
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").unique().notNull(),
    password: (0, pg_core_1.text)("password").notNull(),
    email: (0, pg_core_1.text)("email").unique().notNull(),
    name: (0, pg_core_1.text)("name"),
    phoneNumber: (0, pg_core_1.text)("phone_number"),
    isPro: (0, pg_core_1.boolean)("is_pro").default(false),
    isAdmin: (0, pg_core_1.boolean)("is_admin").default(false),
    emailVerified: (0, pg_core_1.boolean)("email_verified").default(false),
    verificationToken: (0, pg_core_1.text)("verification_token"),
    verificationTokenExpiry: (0, pg_core_1.timestamp)("verification_token_expiry"),
    createdAt: (0, pg_core_1.timestamp)("created_at").default((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").default((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
});
// User health profile and statistics
exports.healthStats = (0, pg_core_1.pgTable)("health_stats", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(function () { return exports.users.id; }),
    weight: (0, pg_core_1.integer)("weight"),
    dateOfBirth: (0, pg_core_1.date)("date_of_birth"),
    averageSleep: (0, pg_core_1.integer)("average_sleep"),
    profilePhotoUrl: (0, pg_core_1.text)("profile_photo_url"),
    allergies: (0, pg_core_1.json)("allergies").$type(),
    lastUpdated: (0, pg_core_1.timestamp)("last_updated").default((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
});
// Primary supplement tracking table - Stores user's active supplements
// This table is in the main database and links to the external RDS for logs
exports.supplements = (0, pg_core_1.pgTable)("supplements", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(function () { return exports.users.id; }),
    name: (0, pg_core_1.text)("name").notNull(),
    dosage: (0, pg_core_1.text)("dosage").notNull(),
    frequency: (0, pg_core_1.text)("frequency").notNull(),
    notes: (0, pg_core_1.text)("notes"),
    active: (0, pg_core_1.boolean)("active").default(true),
    startDate: (0, pg_core_1.timestamp)("start_date").default((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    createdAt: (0, pg_core_1.timestamp)("created_at").default((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").default((0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
});
// Supplement tracking logs - This schema is mirrored in the external RDS database
// Used for storing detailed supplement intake history and effects
exports.supplementLogs = (0, pg_core_1.pgTable)("supplement_logs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    supplementId: (0, pg_core_1.integer)("supplement_id").references(function () { return exports.supplements.id; }),
    userId: (0, pg_core_1.integer)("user_id").references(function () { return exports.users.id; }),
    takenAt: (0, pg_core_1.timestamp)("taken_at").default((0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    notes: (0, pg_core_1.text)("notes"),
    effects: (0, pg_core_1.json)("effects").$type(),
});
// Reference table for supplement names and categories
// Used by the autocomplete feature when users search for supplements
// This is in the main database and powers the Trie-based search functionality
exports.supplementReference = (0, pg_core_1.pgTable)("supplement_reference", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").unique().notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").default((0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").default((0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
});
// Blog content management
exports.blogPosts = (0, pg_core_1.pgTable)("blog_posts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    slug: (0, pg_core_1.text)("slug").unique().notNull(),
    excerpt: (0, pg_core_1.text)("excerpt").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    thumbnailUrl: (0, pg_core_1.text)("thumbnail_url").notNull(),
    publishedAt: (0, pg_core_1.timestamp)("published_at").default((0, drizzle_orm_1.sql)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    createdAt: (0, pg_core_1.timestamp)("created_at").default((0, drizzle_orm_1.sql)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").default((0, drizzle_orm_1.sql)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
});
// Qualitative user logs for AI interactions and general notes
// Stored in the external RDS database for better scalability
exports.qualitativeLogs = (0, pg_core_1.pgTable)("qualitative_logs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(function () { return exports.users.id; }).notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    loggedAt: (0, pg_core_1.timestamp)("logged_at").default((0, drizzle_orm_1.sql)(templateObject_13 || (templateObject_13 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))),
    type: (0, pg_core_1.text)("type"),
    tags: (0, pg_core_1.json)("tags").$type(),
    sentimentScore: (0, pg_core_1.integer)("sentiment_score"),
    metadata: (0, pg_core_1.json)("metadata").$type(),
});
// Zod schemas for type-safe database operations
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users);
exports.selectUserSchema = (0, drizzle_zod_1.createSelectSchema)(exports.users);
exports.insertHealthStatsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.healthStats);
exports.selectHealthStatsSchema = (0, drizzle_zod_1.createSelectSchema)(exports.healthStats);
exports.insertSupplementSchema = (0, drizzle_zod_1.createInsertSchema)(exports.supplements);
exports.selectSupplementSchema = (0, drizzle_zod_1.createSelectSchema)(exports.supplements);
exports.insertSupplementLogSchema = (0, drizzle_zod_1.createInsertSchema)(exports.supplementLogs);
exports.selectSupplementLogSchema = (0, drizzle_zod_1.createSelectSchema)(exports.supplementLogs);
exports.insertSupplementReferenceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.supplementReference);
exports.selectSupplementReferenceSchema = (0, drizzle_zod_1.createSelectSchema)(exports.supplementReference);
exports.insertQualitativeLogSchema = (0, drizzle_zod_1.createInsertSchema)(exports.qualitativeLogs);
exports.selectQualitativeLogSchema = (0, drizzle_zod_1.createSelectSchema)(exports.qualitativeLogs);
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13;
