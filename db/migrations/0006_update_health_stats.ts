
import { sql } from 'drizzle-orm';

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN height TYPE numeric,
    ALTER COLUMN weight TYPE numeric,
    ALTER COLUMN age DROP COLUMN IF EXISTS,
    ADD COLUMN IF NOT EXISTS age INTEGER;
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN height TYPE integer,
    ALTER COLUMN weight TYPE integer,
    DROP COLUMN IF EXISTS age;
  `);
}
