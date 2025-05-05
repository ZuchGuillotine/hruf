import { db } from '../index';
import { sql } from 'drizzle-orm';

export async function up() {
  console.log('Starting migration: Adding subscription tiers...');
  try {
    await db.execute(sql`
      -- Add subscription tier column if it doesn't exist
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' NOT NULL,
      ADD COLUMN IF NOT EXISTS ai_interactions_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS ai_interactions_reset TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS lab_uploads_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lab_uploads_reset TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS tier_start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

      -- Create function to manage tier changes
      CREATE OR REPLACE FUNCTION update_tier_start_date()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
          NEW.tier_start_date = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger for tier changes
      DROP TRIGGER IF EXISTS trigger_tier_start_date ON users;
      CREATE TRIGGER trigger_tier_start_date
        BEFORE UPDATE OF subscription_tier ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_tier_start_date();
    `);

    console.log('✅ Successfully added subscription tier columns and triggers');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down() {
  try {
    await db.execute(sql`
      -- Remove trigger and function
      DROP TRIGGER IF EXISTS trigger_tier_start_date ON users;
      DROP FUNCTION IF EXISTS update_tier_start_date;

      -- Remove columns
      ALTER TABLE users
      DROP COLUMN IF EXISTS subscription_tier,
      DROP COLUMN IF EXISTS ai_interactions_count,
      DROP COLUMN IF EXISTS ai_interactions_reset,
      DROP COLUMN IF EXISTS lab_uploads_count,
      DROP COLUMN IF EXISTS lab_uploads_reset,
      DROP COLUMN IF EXISTS tier_start_date;
    `);

    console.log('✅ Successfully removed subscription tier columns');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}