
import { db } from '../index';
import { sql } from "drizzle-orm";

async function main() {
  console.log('Starting migration...');
  try {
    // Add height column
    await db.execute(sql`ALTER TABLE health_stats ADD COLUMN IF NOT EXISTS height numeric`);
    console.log('Added height column');

    // Drop existing primary key
    await db.execute(sql`ALTER TABLE health_stats DROP CONSTRAINT IF EXISTS health_stats_pkey`);
    console.log('Dropped primary key constraint');

    // Remove duplicates keeping only the latest record
    await db.execute(sql`
      DELETE FROM health_stats a USING (
        SELECT user_id, MAX(last_updated) as max_date
        FROM health_stats 
        GROUP BY user_id
        HAVING COUNT(*) > 1
      ) b
      WHERE a.user_id = b.user_id 
      AND a.last_updated < b.max_date
    `);
    console.log('Removed duplicate entries');

    // Add new primary key
    await db.execute(sql`ALTER TABLE health_stats ADD CONSTRAINT health_stats_pkey PRIMARY KEY (user_id)`);
    console.log('Added new primary key constraint');

    // Drop id column
    await db.execute(sql`ALTER TABLE health_stats DROP COLUMN IF EXISTS id`);
    console.log('Dropped id column');

    // Modify weight column
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

// Keep these for compatibility
export async function up(db: any) {
  try {
    // Add height column
    await db.execute(sql`ALTER TABLE health_stats ADD COLUMN IF NOT EXISTS height numeric`);
    console.log('Added height column');

    // Remove duplicates keeping only the latest record
    await db.execute(sql`
      DELETE FROM health_stats a USING (
        SELECT user_id, MAX(last_updated) as max_date
        FROM health_stats 
        GROUP BY user_id
        HAVING COUNT(*) > 1
      ) b
      WHERE a.user_id = b.user_id 
      AND a.last_updated < b.max_date
    `);
    console.log('Removed duplicate entries');

    // Drop existing primary key and add new one
    await db.execute(sql`ALTER TABLE health_stats DROP CONSTRAINT IF EXISTS health_stats_pkey`);
    await db.execute(sql`ALTER TABLE health_stats ADD CONSTRAINT health_stats_pkey PRIMARY KEY (user_id)`);
    console.log('Updated primary key');

    // Drop id column
    await db.execute(sql`ALTER TABLE health_stats DROP COLUMN IF EXISTS id`);
    console.log('Dropped id column');

    // Type modifications
    await db.execute(sql`ALTER TABLE health_stats ALTER COLUMN weight TYPE numeric USING weight::numeric`);
    console.log('Modified column types');
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
