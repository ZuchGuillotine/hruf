import { supplementRdsDb } from "../supplement-rds";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting supplement RDS schema creation...");

    // Enable pg_trgm extension for fuzzy search
    await supplementRdsDb.execute(sql`
      CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;
      CREATE EXTENSION IF NOT EXISTS fuzzystrmatch SCHEMA public;
    `);
    console.log("Enabled extensions");

    // Create supplement_logs table
    await supplementRdsDb.execute(sql`
      CREATE TABLE IF NOT EXISTS supplement_logs (
        id SERIAL PRIMARY KEY,
        supplement_id INTEGER,
        user_id INTEGER,
        taken_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        effects JSONB
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_id 
        ON supplement_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_supplement_logs_taken_at 
        ON supplement_logs (taken_at);
    `);
    console.log("Created supplement_logs table");

    // Create qualitative_logs table
    await supplementRdsDb.execute(sql`
      CREATE TABLE IF NOT EXISTS qualitative_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        type TEXT,
        tags JSONB,
        sentiment_score INTEGER,
        metadata JSONB
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_user_id 
        ON qualitative_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_logged_at 
        ON qualitative_logs (logged_at);
      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_type 
        ON qualitative_logs (type);
    `);
    console.log("Created qualitative_logs table");

  } catch (error) {
    console.error("Error creating supplement RDS schema:", error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
