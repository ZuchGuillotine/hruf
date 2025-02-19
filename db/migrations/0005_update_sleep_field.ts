
import { sql } from 'drizzle-orm';
import { pgTable } from 'drizzle-orm/pg-core';

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE numeric(4,2)
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE integer
  `);
}
