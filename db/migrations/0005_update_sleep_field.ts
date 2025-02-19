
import { sql } from 'drizzle-orm';

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE numeric;
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE integer;
  `);
}
