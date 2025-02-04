import { rdsDb } from "../rds";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting RDS schema creation...");

    // Enable pg_trgm extension for fuzzy search
    console.log("Attempting to enable pg_trgm extension...");
    await rdsDb.execute(sql`
      CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;
      CREATE EXTENSION IF NOT EXISTS fuzzystrmatch SCHEMA public;
    `);
    console.log("Enabled extensions");

    // Create the supplement_reference table
    console.log("Creating supplement_reference table...");
    await rdsDb.execute(sql`
      CREATE TABLE IF NOT EXISTS supplement_reference (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL DEFAULT 'General',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create a trigram index on name for efficient fuzzy search
      DROP INDEX IF EXISTS idx_supplement_reference_name_trgm;
      CREATE INDEX idx_supplement_reference_name_trgm
        ON supplement_reference USING gin (name gin_trgm_ops);

      -- Create a trigram index on both name and category for combined searches
      DROP INDEX IF EXISTS idx_supplement_reference_name_category_trgm;
      CREATE INDEX idx_supplement_reference_name_category_trgm
        ON supplement_reference USING gin ((name || ' ' || category) gin_trgm_ops);

      -- Regular B-tree index on category for exact matches and sorting
      DROP INDEX IF EXISTS idx_supplement_reference_category;
      CREATE INDEX idx_supplement_reference_category
        ON supplement_reference (category);
    `);

    console.log("Supplement reference schema created successfully");

  } catch (error) {
    console.error("Error creating RDS schema:", error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());