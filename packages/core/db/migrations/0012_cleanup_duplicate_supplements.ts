import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import logger from '../../server/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

export async function up(db: any) {
  try {
    logger.info("Starting migration: Clean up duplicate supplements");

    // First, let's get a list of all duplicates
    const duplicates = await db.execute(sql`
      WITH duplicates AS (
        SELECT name, COUNT(*) as count
        FROM supplement_reference
        GROUP BY name
        HAVING COUNT(*) > 1
      )
      SELECT sr.*, d.count
      FROM supplement_reference sr
      JOIN duplicates d ON sr.name = d.name
      ORDER BY sr.name, sr.id;
    `);

    logger.info(`Found ${duplicates.length} duplicate entries to process`);

    // For each group of duplicates, we'll keep the most specific version
    // (the one with the most detailed name/form)
    const toDelete: number[] = [];
    let currentName = '';
    let keepId = 0;
    let maxSpecificity = 0;

    for (const row of duplicates) {
      if (row.name !== currentName) {
        // New group of duplicates
        currentName = row.name;
        keepId = row.id;
        maxSpecificity = calculateSpecificity(row.name);
      } else {
        // Same group, compare specificity
        const specificity = calculateSpecificity(row.name);
        if (specificity > maxSpecificity) {
          toDelete.push(keepId);
          keepId = row.id;
          maxSpecificity = specificity;
        } else {
          toDelete.push(row.id);
        }
      }
    }

    if (toDelete.length > 0) {
      logger.info(`Deleting ${toDelete.length} duplicate entries`);
      
      // Delete the duplicates in batches to avoid parameter limits
      const batchSize = 100;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        await db.execute(sql`
          DELETE FROM supplement_reference
          WHERE id IN (${sql.join(batch, sql`, `)});
        `);
        logger.info(`Deleted batch ${i / batchSize + 1} of ${Math.ceil(toDelete.length / batchSize)}`);
      }

      logger.info("Successfully cleaned up duplicate supplements");
    } else {
      logger.info("No duplicates to clean up");
    }

    // Now add the unique constraint
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

// Helper function to calculate how specific a supplement name is
// Higher score means more specific (e.g., "Vitamin B12 (Methylcobalamin)" is more specific than "Vitamin B12")
function calculateSpecificity(name: string): number {
  let score = 0;
  const lowerName = name.toLowerCase();

  // Points for having a specific form/type in parentheses
  if (lowerName.includes('(') && lowerName.includes(')')) {
    score += 3;
    // Extra points for specific forms
    if (lowerName.includes('methyl') || lowerName.includes('citrate') || 
        lowerName.includes('glycinate') || lowerName.includes('picolinate')) {
      score += 2;
    }
  }

  // Points for having specific descriptors
  if (lowerName.includes('extract')) score += 2;
  if (lowerName.includes('powder')) score += 1;
  if (lowerName.includes('capsule')) score += 1;
  if (lowerName.includes('tablet')) score += 1;
  if (lowerName.includes('liquid')) score += 1;
  if (lowerName.includes('general')) score -= 2;

  return score;
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
      logger.info('Running duplicate cleanup migration...');
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