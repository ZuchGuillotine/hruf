
import { sql } from "drizzle-orm";

export async function up(db: any) {
  try {
    await db.execute(sql`
      ALTER TABLE health_stats 
      ADD COLUMN IF NOT EXISTS gender text;
    `);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down(db: any) {
  try {
    await db.execute(sql`
      ALTER TABLE health_stats 
      DROP COLUMN IF EXISTS gender;
    `);
  } catch (error) {
    console.error('Migration rollback failed:', error);
    throw error;
  }
}
