import { rdsDb } from "../rds";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting RDS schema creation...");

    // Enable pg_trgm extension for fuzzy search
    console.log("Attempting to enable pg_trgm extension...");
    await rdsDb.execute(sql`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
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

      CREATE INDEX IF NOT EXISTS idx_supplement_reference_name_trgm
        ON supplement_reference USING gin (name gin_trgm_ops);

      CREATE INDEX IF NOT EXISTS idx_supplement_reference_category
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