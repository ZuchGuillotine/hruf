
import { sql } from "drizzle-orm";
import { pgTable, serial, integer, text, timestamp, numeric, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { labResults } from "../schema";

// Main biomarker results table
export const biomarkerResults = pgTable("biomarker_results", {
  id: serial("id").primaryKey(),
  labResultId: integer("lab_result_id").references(() => labResults.id, { onDelete: "CASCADE" }).notNull(),
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

// Biomarker processing status tracking
export const biomarkerProcessingStatus = pgTable("biomarker_processing_status", {
  labResultId: integer("lab_result_id").references(() => labResults.id, { onDelete: "CASCADE" }).primaryKey(),
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
  }>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Reference data for biomarkers
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

// Migration up function
export async function up(db: any) {
  await db.schema.createTable(biomarkerResults);
  await db.schema.createTable(biomarkerProcessingStatus);
  await db.schema.createTable(biomarkerReference);

  // Create indexes
  await db.schema.createIndex("biomarker_results_lab_result_idx").on(biomarkerResults).column("lab_result_id");
  await db.schema.createIndex("biomarker_results_name_idx").on(biomarkerResults).column("name");
  await db.schema.createIndex("biomarker_results_test_date_idx").on(biomarkerResults).column("test_date");
  await db.schema.createIndex("biomarker_results_name_date_idx").on(biomarkerResults).columns(["name", "test_date"]);
  await db.schema.createUniqueIndex("unique_lab_biomarker").on(biomarkerResults).columns(["lab_result_id", "name", "test_date"]);

  // Insert initial reference data
  await db.insert(biomarkerReference).values([
    {
      name: "glucose",
      category: "metabolic",
      defaultUnit: "mg/dL",
      description: "Blood glucose level",
      metadata: {
        commonNames: ["Blood Sugar", "Fasting Glucose"],
        normalRanges: [{ range: "74-106", unit: "mg/dL" }],
        importance: 1
      }
    },
    {
      name: "cholesterol",
      category: "lipid",
      defaultUnit: "mg/dL",
      description: "Total cholesterol level",
      metadata: {
        commonNames: ["Total Cholesterol"],
        normalRanges: [{ range: "125-200", unit: "mg/dL" }],
        importance: 1
      }
    }
  ]);
}

// Migration down function
export async function down(db: any) {
  await db.schema.dropTable(biomarkerResults);
  await db.schema.dropTable(biomarkerProcessingStatus);
  await db.schema.dropTable(biomarkerReference);
}
