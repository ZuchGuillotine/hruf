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
    console.log('Starting migration: Update health stats columns...');
    
    await db.execute(sql`ALTER TABLE health_stats ADD COLUMN IF NOT EXISTS height numeric`);
    console.log('Added height column');

    await db.execute(sql`ALTER TABLE health_stats DROP CONSTRAINT IF EXISTS health_stats_pkey`);
    console.log('Dropped primary key constraint');

    await db.execute(sql`ALTER TABLE health_stats ALTER COLUMN height TYPE numeric USING height::numeric`);
    console.log('Modified height column type');

    await db.execute(sql`ALTER TABLE health_stats ALTER COLUMN weight TYPE numeric USING weight::numeric`);
    console.log('Modified weight column type');

    await db.execute(sql`ALTER TABLE health_stats ADD CONSTRAINT health_stats_pkey PRIMARY KEY (user_id)`);
    console.log('Added new primary key constraint');

    await db.execute(sql`ALTER TABLE health_stats DROP COLUMN IF EXISTS id`);
    console.log('Dropped id column');

    console.log('Migration completed successfully');
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