/**
 * Database: AWS RDS (STusertest)
 * Purpose: Track supplement intake logs and chat interactions
 * 
 * This database is separate from:
 * 1. NeonDB (Replit) - Core user data, authentication, and health stats
 * 2. stacktrackertest1 (AWS RDS) - Supplement name autocomplete with fuzzy search
 */
import { supplementRdsDb } from "../supplement-rds";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting STusertest schema creation...");

    // Create supplement_logs table for tracking supplement intake
    await supplementRdsDb.execute(sql`
      CREATE TABLE IF NOT EXISTS supplement_logs (
        id SERIAL PRIMARY KEY,
        supplement_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        taken_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        effects JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_effects CHECK (effects IS NULL OR jsonb_typeof(effects) = 'object')
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_id 
        ON supplement_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_supplement_logs_taken_at 
        ON supplement_logs (taken_at);
      CREATE INDEX IF NOT EXISTS idx_supplement_logs_supplement_id 
        ON supplement_logs (supplement_id);
    `);
    console.log("Created supplement_logs table");

    // Create qualitative_logs table for chat interactions
    await supplementRdsDb.execute(sql`
      CREATE TABLE IF NOT EXISTS qualitative_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        type TEXT NOT NULL,
        tags JSONB DEFAULT '[]',
        sentiment_score INTEGER,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_tags CHECK (tags IS NULL OR jsonb_typeof(tags) = 'array'),
        CONSTRAINT valid_metadata CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object')
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_user_id 
        ON qualitative_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_logged_at 
        ON qualitative_logs (logged_at);
      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_type 
        ON qualitative_logs (type);
      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_sentiment 
        ON qualitative_logs (sentiment_score);
    `);
    console.log("Created qualitative_logs table");

    // Add triggers for updated_at timestamp
    await supplementRdsDb.execute(sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_supplement_logs_updated_at ON supplement_logs;
      CREATE TRIGGER update_supplement_logs_updated_at
          BEFORE UPDATE ON supplement_logs
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_qualitative_logs_updated_at ON qualitative_logs;
      CREATE TRIGGER update_qualitative_logs_updated_at
          BEFORE UPDATE ON qualitative_logs
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log("Created update triggers");

    console.log("STusertest schema creation completed successfully");

  } catch (error) {
    console.error("Error creating STusertest schema:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());