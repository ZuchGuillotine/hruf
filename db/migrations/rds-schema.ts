
import { rdsDb } from "../rds";
import { sql } from "drizzle-orm";

async function main() {
  try {
    // Create the supplementReference table in RDS
    await rdsDb.execute(sql`
      CREATE TABLE IF NOT EXISTS supplement_reference (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        alternative_names JSONB,
        description TEXT,
        source TEXT,
        source_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_supplement_name ON supplement_reference(name);
      CREATE INDEX IF NOT EXISTS idx_supplement_category ON supplement_reference(category);
    `);
    
    console.log("RDS schema created successfully");
  } catch (error) {
    console.error("Error creating RDS schema:", error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
