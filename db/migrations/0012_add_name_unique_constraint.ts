import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import logger from '../../server/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

export async function up(db: any) {
  try {
    logger.info("Starting migration: Add unique constraint to supplement_reference name column");

    // First check if there are any duplicate names
    const duplicates = await db.execute(sql`
      SELECT name, COUNT(*) as count
      FROM supplement_reference
      GROUP BY name
      HAVING COUNT(*) > 1;
    `);

    if (duplicates.length > 0) {
      logger.warn("Found duplicate supplement names:", duplicates);
      throw new Error("Cannot add unique constraint: duplicate names exist in the database");
    }

    // Add the unique constraint
    await db.execute(sql`
      ALTER TABLE supplement_reference
      ADD CONSTRAINT supplement_reference_name_unique UNIQUE (name);
    `);

    logger.info("Successfully added unique constraint to name column");
  } catch (error) {
    logger.error("Error in migration:", error);
    throw error;
  }
}

// Execute migration if running directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  import('postgres').then(async ({ default: postgres }) => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);

    try {
      logger.info('Running unique constraint migration...');
      await up(db);
      logger.info('Migration completed successfully');
    } catch (error) {
      logger.error('Migration failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      process.exit(1);
    } finally {
      await client.end();
      process.exit(0);
    }
  });
} 