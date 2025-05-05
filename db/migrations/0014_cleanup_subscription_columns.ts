
import { db } from '../index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Starting subscription columns cleanup migration...');
  try {
    await db.execute(sql`
      -- First ensure all users have a valid tier
      UPDATE users 
      SET subscription_tier = 
        CASE 
          WHEN is_pro = true THEN 'pro'
          WHEN subscription_status = 'active' THEN 'core'
          ELSE 'free'
        END
      WHERE subscription_tier IS NULL;

      -- Remove obsolete columns
      ALTER TABLE users
      DROP COLUMN IF EXISTS trial_ends_at,
      DROP COLUMN IF EXISTS is_pro,
      DROP COLUMN IF EXISTS subscription_status;
    `);
    
    console.log('✅ Successfully cleaned up subscription columns');
    return Promise.resolve();
  } catch (error) {
    console.error('Migration failed:', error);
    return Promise.reject(error);
  }
}

// Execute migration if running directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  main()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export async function up() {
  return main();
}

export async function down() {
  try {
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS subscription_status TEXT;
    `);
    
    console.log('✅ Successfully restored subscription columns');
    return Promise.resolve();
  } catch (error) {
    console.error('Rollback failed:', error);
    return Promise.reject(error);
  }
}
