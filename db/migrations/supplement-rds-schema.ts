/**
 * Database: AWS RDS
 * Purpose: Combined schema for supplement tracking and qualitative logs
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

// Create a PostgreSQL pool for RDS
const pool = new Pool({
  connectionString: process.env.AWS_RDS_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Create Drizzle instance
const supplementRdsDb = drizzle(pool);

async function main() {
  try {
    console.log("Starting RDS schema creation...");

    // Enable required extensions for fuzzy search
    await supplementRdsDb.execute(sql`
      CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;
      CREATE EXTENSION IF NOT EXISTS fuzzystrmatch SCHEMA public;
    `);
    console.log("Enabled extensions");

    // Create supplement_logs table with enhanced structure
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

      CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_id 
        ON supplement_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_supplement_logs_taken_at 
        ON supplement_logs (taken_at);
      CREATE INDEX IF NOT EXISTS idx_supplement_logs_supplement_id 
        ON supplement_logs (supplement_id);
    `);
    console.log("Created supplement_logs table");

    // Create qualitative_logs table
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

      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_user_id 
        ON qualitative_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_logged_at 
        ON qualitative_logs (logged_at);
      CREATE INDEX IF NOT EXISTS idx_qualitative_logs_type 
        ON qualitative_logs (type);
    `);
    console.log("Created qualitative_logs table");

    // Add updated_at trigger for both tables
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

    console.log("RDS schema creation completed successfully");

  } catch (error) {
    console.error("Error creating RDS schema:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());