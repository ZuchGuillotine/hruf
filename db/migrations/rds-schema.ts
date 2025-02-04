
import { rdsDb } from "../rds";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Starting RDS schema creation...");

    // Enable pg_trgm extension for fuzzy search
    console.log("Attempting to enable pg_trgm extension...");
    await rdsDb.execute(sql`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);
    console.log("Enabled pg_trgm extension");

    // Create the supplements table in RDS
    console.log("Attempting to create supplements table...");
    await rdsDb.execute(sql`
      CREATE TABLE IF NOT EXISTS supplements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Created supplements table");

    // Create trigram index for fuzzy search
    console.log("Attempting to create trigram index...");
    await rdsDb.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_supplements_name_trgm
        ON supplements USING gin (name gin_trgm_ops);
    `);
    console.log("Created trigram index for fuzzy search");

    // Insert initial supplement data
    console.log("Inserting supplement data...");
    await rdsDb.execute(sql`
      INSERT INTO supplements (name) VALUES
        ('Acai (General)'),
        ('Acai Berry Extract'),
        ('Acai Berry Powder'),
        ('Acetyl-L-Carnitine (General)'),
        ('Acetyl-L-Carnitine HCL'),
        ('Aged Garlic Extract (General)'),
        ('Aged Garlic Extract Powder'),
        ('Agmatine (General)'),
        ('Agmatine Sulfate'),
        ('Alpha Lipoic Acid (General)'),
        ('Alpha Lipoic Acid (R-ALA)'),
        ('Alpha Lipoic Acid (Racemic)'),
        ('Algae Oil (General)'),
        ('Alfalfa (General)'),
        ('Allicin (General)'),
        ('Alpha GPC (General)'),
        ('Andrographis (General)'),
        ('Andrographis Paniculata Extract'),
        ('Arginine (General)'),
        ('L-Arginine'),
        ('Arginine Alpha-Ketoglutarate'),
        ('Ashwagandha (General)'),
        ('Ashwagandha Root Powder'),
        ('Ashwagandha Extract (KSM-66)'),
        ('Ashwagandha Extract (Sensoril)'),
        ('Astaxanthin (General)'),
        ('Astaxanthin (Haematococcus pluvialis)')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log("Supplement data inserted successfully");

    console.log("RDS schema created successfully");
  } catch (error) {
    console.error("Error creating RDS schema:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
