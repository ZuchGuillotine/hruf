import { sql } from 'drizzle-orm';
import { db } from '../index';

export async function up() {
  console.log('Starting migration: Adding subscription tier column...');
  try {
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' NOT NULL;
    `);
    console.log('✅ Successfully added subscription_tier column');
    return Promise.resolve();
  } catch (error) {
    console.error('Migration failed:', error);
    return Promise.reject(error);
  }
}

// Execute migration if running directly
if (require.main === module) {
  up().then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export async function down() {
  console.log('Starting rollback: Removing subscription tier column...');
  try {
    await db.execute(sql`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS subscription_tier;
    `);
    console.log('✅ Successfully removed subscription_tier column');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}