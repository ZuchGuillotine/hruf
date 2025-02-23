
import { db } from '../index';
import { sql } from 'drizzle-orm';

async function checkHealthStatsTable() {
  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'health_stats';
    `);
    console.log('Health Stats Table Structure:', result.rows);
  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    process.exit();
  }
}

checkHealthStatsTable();
