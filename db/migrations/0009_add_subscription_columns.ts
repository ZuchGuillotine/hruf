
import { sql } from "drizzle-orm";

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS subscription_id TEXT,
    ADD COLUMN IF NOT EXISTS subscription_status TEXT,
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS chat_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_rewarded_at TIMESTAMPTZ;
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE users
    DROP COLUMN IF EXISTS subscription_id,
    DROP COLUMN IF EXISTS subscription_status,
    DROP COLUMN IF EXISTS trial_ends_at,
    DROP COLUMN IF EXISTS chat_count,
    DROP COLUMN IF EXISTS last_rewarded_at;
  `);
}
