
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

    // Create the supplement_reference table
    console.log("Creating supplement_reference table...");
    await rdsDb.execute(sql`
      CREATE TABLE IF NOT EXISTS supplement_reference (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'General',
        alternative_names JSONB DEFAULT '[]',
        description TEXT,
        source TEXT,
        source_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_supplement_reference_name_trgm
        ON supplement_reference USING gin (name gin_trgm_ops);
    `);

    // Insert initial supplement data
    console.log("Inserting supplement data...");
    await rdsDb.execute(sql`
      INSERT INTO supplement_reference (name, category) VALUES
        ('Acai (General)', 'Herbal'),
        ('Acai Berry Extract', 'Herbal'),
        ('Acai Berry Powder', 'Herbal'),
        ('Acetyl-L-Carnitine (General)', 'Amino Acids'),
        ('Acetyl-L-Carnitine HCL', 'Amino Acids'),
        ('Aged Garlic Extract (General)', 'Herbal'),
        ('Aged Garlic Extract Powder', 'Herbal'),
        ('Agmatine (General)', 'Amino Acids'),
        ('Agmatine Sulfate', 'Amino Acids'),
        ('Alpha Lipoic Acid (General)', 'Antioxidants'),
        ('Alpha Lipoic Acid (R-ALA)', 'Antioxidants'),
        ('Alpha Lipoic Acid (Racemic)', 'Antioxidants'),
        ('Algae Oil (General)', 'Fatty Acids'),
        ('Alfalfa (General)', 'Herbal'),
        ('Allicin (General)', 'Herbal'),
        ('Alpha GPC (General)', 'Nootropics'),
        ('Andrographis (General)', 'Herbal'),
        ('Andrographis Paniculata Extract', 'Herbal'),
        ('Arginine (General)', 'Amino Acids'),
        ('L-Arginine', 'Amino Acids'),
        ('Arginine Alpha-Ketoglutarate', 'Amino Acids'),
        ('Ashwagandha (General)', 'Herbal'),
        ('Ashwagandha Root Powder', 'Herbal'),
        ('Ashwagandha Extract (KSM-66)', 'Herbal'),
        ('Ashwagandha Extract (Sensoril)', 'Herbal'),
        ('Astaxanthin (General)', 'Antioxidants'),
        ('Astaxanthin (Haematococcus pluvialis)', 'Antioxidants')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log("Supplement reference data inserted successfully");

  } catch (error) {
    console.error("Error creating RDS schema:", error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
