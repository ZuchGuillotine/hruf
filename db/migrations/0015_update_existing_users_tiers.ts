
import { db } from '../index';
import { sql } from 'drizzle-orm';

export async function up() {
  try {
    // First ensure subscription_tier column exists
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'subscription_tier'
        ) THEN
          ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free' NOT NULL;
        END IF;
      END $$;
    `);

    // Update admin user to pro tier
    await db.execute(sql`
      UPDATE users 
      SET subscription_tier = 'pro'
      WHERE is_admin = true;
    `);

    // Update specific user to core tier
    await db.execute(sql`
      UPDATE users 
      SET subscription_tier = 'core'
      WHERE email = 'delicacybydesign';
    `);

    // Ensure all remaining users have free tier
    await db.execute(sql`
      UPDATE users 
      SET subscription_tier = 'free'
      WHERE subscription_tier IS NULL 
      OR subscription_tier NOT IN ('pro', 'core');
    `);
    
    console.log('✅ Successfully updated existing users with subscription tiers');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down() {
  try {
    // Set all tiers back to free as a safe rollback
    await db.execute(sql`
      UPDATE users 
      SET subscription_tier = 'free';
    `);
    
    console.log('✅ Successfully rolled back subscription tier updates');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}
