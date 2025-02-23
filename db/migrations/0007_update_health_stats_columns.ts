
import { db } from '../index';
import { sql } from "drizzle-orm";

async function main() {
  console.log('Starting migration...');
  try {
    await db.execute(sql`ALTER TABLE health_stats ADD COLUMN IF NOT EXISTS height numeric`);
    console.log('Added height column');

    await db.execute(sql`ALTER TABLE health_stats DROP CONSTRAINT IF EXISTS health_stats_pkey`);
    console.log('Dropped primary key constraint');

    // Create a temporary table to store the latest records
    await db.execute(sql`
      CREATE TEMP TABLE temp_health_stats AS
      SELECT DISTINCT ON (user_id) *
      FROM health_stats
      ORDER BY user_id, last_updated DESC
    `);
    console.log('Created temporary table with latest records');

    // Clear the original table
    await db.execute(sql`TRUNCATE TABLE health_stats`);
    console.log('Cleared original table');

    // Insert back only the latest records
    await db.execute(sql`
      INSERT INTO health_stats
      SELECT * FROM temp_health_stats
    `);
    console.log('Restored latest records');

    // Drop the temporary table
    await db.execute(sql`DROP TABLE temp_health_stats`);
    console.log('Cleaned up temporary table');

    // Now safe to add the primary key
    await db.execute(sql`ALTER TABLE health_stats ADD CONSTRAINT health_stats_pkey PRIMARY KEY (user_id)`);
    console.log('Added new primary key constraint');

    await db.execute(sql`ALTER TABLE health_stats ALTER COLUMN weight TYPE numeric USING weight::numeric`);
    console.log('Modified weight column type');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());

export async function up(db: any) {
  try {
    await db.execute(sql`ALTER TABLE health_stats ADD COLUMN IF NOT EXISTS height numeric`);
    
    await db.execute(sql`ALTER TABLE health_stats DROP CONSTRAINT IF EXISTS health_stats_pkey`);
    
    await db.execute(sql`
      CREATE TEMP TABLE temp_health_stats AS
      SELECT DISTINCT ON (user_id) *
      FROM health_stats
      ORDER BY user_id, last_updated DESC
    `);
    
    await db.execute(sql`TRUNCATE TABLE health_stats`);
    
    await db.execute(sql`
      INSERT INTO health_stats
      SELECT * FROM temp_health_stats
    `);
    
    await db.execute(sql`DROP TABLE temp_health_stats`);
    
    await db.execute(sql`ALTER TABLE health_stats ADD CONSTRAINT health_stats_pkey PRIMARY KEY (user_id)`);
    
    await db.execute(sql`ALTER TABLE health_stats ALTER COLUMN weight TYPE numeric USING weight::numeric`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down(db: any) {
  try {
    await db.execute(sql`ALTER TABLE health_stats DROP COLUMN IF EXISTS height`);
    await db.execute(sql`ALTER TABLE health_stats DROP CONSTRAINT IF EXISTS health_stats_pkey`);
    await db.execute(sql`ALTER TABLE health_stats ADD COLUMN id SERIAL PRIMARY KEY`);
  } catch (error) {
    console.error('Migration rollback failed:', error);
    throw error;
  }
}
