import { db } from '../index';
import { sql } from "drizzle-orm";

async function main() {
  console.log('Starting push notification tables migration...');
  try {
    // Ensure users table has push_notifications_enabled column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false NOT NULL;
    `);

    console.log('Added push_notifications_enabled column to users table');

    // Create push_subscriptions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create index on user_id for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
    `);

    // Create unique index on endpoint to prevent duplicate subscriptions
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
    `);
    
    console.log('Push notifications migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());

export async function up(db: any) {
  await main();
}

export async function down(db: any) {
  try {
    // Drop the push_subscriptions table
    await db.execute(sql`
      DROP TABLE IF EXISTS push_subscriptions;
    `);

    // Remove the push_notifications_enabled column from users
    await db.execute(sql`
      ALTER TABLE users DROP COLUMN IF EXISTS push_notifications_enabled;
    `);

    console.log('Push notifications migration rolled back successfully');
  } catch (error) {
    console.error('Migration rollback failed:', error);
    throw error;
  }
}