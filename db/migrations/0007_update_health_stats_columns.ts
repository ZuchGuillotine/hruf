
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

export async function up(db: PostgresJsDatabase) {
  try {
    await db.execute(sql`
      DO $$ 
      BEGIN 
        -- Add height column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'health_stats' AND column_name = 'height'
        ) THEN
          ALTER TABLE health_stats ADD COLUMN height numeric;
        END IF;

        -- Make user_id unique and primary key, drop id column
        ALTER TABLE health_stats DROP CONSTRAINT IF EXISTS health_stats_pkey;
        ALTER TABLE health_stats ADD CONSTRAINT health_stats_pkey PRIMARY KEY (user_id);
        ALTER TABLE health_stats DROP COLUMN IF EXISTS id;
      END $$;
    `);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down(db: PostgresJsDatabase) {
  try {
    await db.execute(sql`
      ALTER TABLE health_stats DROP COLUMN IF EXISTS height;
      ALTER TABLE health_stats DROP CONSTRAINT IF EXISTS health_stats_pkey;
      ALTER TABLE health_stats ADD COLUMN id SERIAL PRIMARY KEY;
    `);
  } catch (error) {
    console.error('Migration rollback failed:', error);
    throw error;
  }
}
