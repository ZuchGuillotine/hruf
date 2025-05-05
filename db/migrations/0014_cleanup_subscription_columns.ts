
import { db } from '../index';
import { sql } from 'drizzle-orm';

export async function up() {
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
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down() {
  try {
    await db.execute(sql`
      -- Restore columns if needed
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS subscription_status TEXT;
    `);
    
    console.log('✅ Successfully restored subscription columns');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}
