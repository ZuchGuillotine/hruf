
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

    // Delete duplicates keeping only the latest record for each user
    await db.execute(sql`
      DELETE FROM health_stats 
      WHERE id IN (
        SELECT h1.id
        FROM health_stats h1
        JOIN (
          SELECT user_id, MAX(last_updated) as max_updated
          FROM health_stats
          GROUP BY user_id
        ) h2 ON h1.user_id = h2.user_id
        WHERE h1.last_updated < h2.max_updated
      )
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

export async function up(db: any) {
  try {
    await db.execute(sql`ALTER TABLE health_stats ADD COLUMN IF NOT EXISTS height numeric`);
    
    await db.execute(sql`ALTER TABLE health_stats DROP CONSTRAINT IF EXISTS health_stats_pkey`);
    
    await db.execute(sql`
      DELETE FROM health_stats 
      WHERE id IN (
        SELECT h1.id
        FROM health_stats h1
        JOIN (
          SELECT user_id, MAX(last_updated) as max_updated
          FROM health_stats
          GROUP BY user_id
        ) h2 ON h1.user_id = h2.user_id
        WHERE h1.last_updated < h2.max_updated
      )
    `);
    
    await db.execute(sql`ALTER TABLE health_stats ADD CONSTRAINT health_stats_pkey PRIMARY KEY (user_id)`);
    
    await db.execute(sql`ALTER TABLE health_stats DROP COLUMN IF EXISTS id`);
    
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
