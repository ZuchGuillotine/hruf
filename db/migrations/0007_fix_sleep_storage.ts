
import { sql } from 'drizzle-orm';

export async function up(db: any) {
  // First convert existing decimal hours to minutes
  await db.execute(sql`
    UPDATE health_stats 
    SET average_sleep = ROUND(average_sleep * 60) 
    WHERE average_sleep IS NOT NULL;
  `);
  
  // Then alter the column type
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE integer 
    USING average_sleep::integer;
  `);
}

export async function down(db: any) {
  // Convert minutes back to decimal hours
  await db.execute(sql`
    UPDATE health_stats 
    SET average_sleep = ROUND((average_sleep::numeric / 60)::numeric, 2) 
    WHERE average_sleep IS NOT NULL;
  `);
  
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE numeric;
  `);
}
