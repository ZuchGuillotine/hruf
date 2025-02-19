
import { sql } from "drizzle-orm";

export async function up(db) {
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE integer 
    USING ROUND(average_sleep * 60)::integer;
  `);
}

export async function down(db) {
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE numeric 
    USING (average_sleep::numeric / 60)::numeric;
  `);
}
