import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { supplementReference } from '../schema';
import logger from '../../server/utils/logger';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function up(db: any) {
  try {
    logger.info("Starting migration: Add expanded supplements list");

    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'attached_assets', 'expanded_supplements_autocomplete.json');
    const supplementsJson = await fs.readFile(jsonPath, 'utf-8');
    const supplements = JSON.parse(supplementsJson) as string[];

    // Helper function to determine category based on supplement name
    const getCategory = (name: string): string => {
      const lowerName = name.toLowerCase();
      
      // Amino Acids and Peptides
      if (lowerName.includes('l-') || lowerName.includes('d-') || 
          lowerName.includes('n-acetyl') || lowerName.includes('peptide') ||
          lowerName.includes('citrulline') || lowerName.includes('ornithine') ||
          lowerName.includes('tyrosine') || lowerName.includes('tryptophan') ||
          lowerName.includes('phenylalanine') || lowerName.includes('methionine') ||
          lowerName.includes('cysteine') || lowerName.includes('taurine') ||
          lowerName.includes('glycine') || lowerName.includes('glutathione') ||
          lowerName.includes('sam-e')) {
        return 'Amino Acids & Peptides';
      }

      // Nootropics
      if (lowerName.includes('racetam') || lowerName.includes('choline') ||
          lowerName.includes('uridine') || lowerName.includes('phosphatidyl') ||
          lowerName.includes('vinpocetine') || lowerName.includes('noopept') ||
          lowerName.includes('centrophenoxine') || lowerName.includes('sulbutiamine') ||
          lowerName.includes('pqq') || lowerName.includes('magnesium l-threonate')) {
        return 'Nootropics';
      }

      // Hormones and SARMs
      if (lowerName.includes('dhea') || lowerName.includes('pregnenolone') ||
          lowerName.includes('andro') || lowerName.includes('sterone') ||
          lowerName.includes('bolone') || lowerName.includes('sarm') ||
          lowerName.includes('rad-') || lowerName.includes('lgd-') ||
          lowerName.includes('mk-') || lowerName.includes('s-4') ||
          lowerName.includes('yk-') || lowerName.includes('sr9009') ||
          lowerName.includes('gw501516')) {
        return 'Hormones & SARMs';
      }

      // Mushrooms and Adaptogens
      if (lowerName.includes('mushroom') || lowerName.includes('cordyceps') ||
          lowerName.includes('reishi') || lowerName.includes('chaga') ||
          lowerName.includes('turkey tail') || lowerName.includes('maitake') ||
          lowerName.includes('shiitake') || lowerName.includes('rhodiola') ||
          lowerName.includes('ginseng') || lowerName.includes('eleuthero') ||
          lowerName.includes('gotu kola') || lowerName.includes('holy basil') ||
          lowerName.includes('schisandra')) {
        return 'Mushrooms & Adaptogens';
      }

      // Herbs and Botanicals
      if (lowerName.includes('root') || lowerName.includes('bark') ||
          lowerName.includes('leaf') || lowerName.includes('extract') ||
          lowerName.includes('berry') || lowerName.includes('flower') ||
          lowerName.includes('herb') || lowerName.includes('seed')) {
        return 'Herbs & Botanicals';
      }

      // Minerals and Electrolytes
      if (lowerName.includes('magnesium') || lowerName.includes('zinc') ||
          lowerName.includes('calcium') || lowerName.includes('potassium') ||
          lowerName.includes('sodium') || lowerName.includes('chromium') ||
          lowerName.includes('manganese') || lowerName.includes('molybdenum') ||
          lowerName.includes('boron') || lowerName.includes('vanadium') ||
          lowerName.includes('silica') || lowerName.includes('electrolyte')) {
        return 'Minerals & Electrolytes';
      }

      // Fats and Oils
      if (lowerName.includes('oil') || lowerName.includes('fat') ||
          lowerName.includes('epa') || lowerName.includes('dha') ||
          lowerName.includes('cla') || lowerName.includes('mct')) {
        return 'Fats & Oils';
      }

      // Digestive Health
      if (lowerName.includes('enzyme') || lowerName.includes('probiotic') ||
          lowerName.includes('fiber') || lowerName.includes('digestive') ||
          lowerName.includes('betaine') || lowerName.includes('butyrate')) {
        return 'Digestive Health';
      }

      // Default category
      return 'Other Supplements';
    };

    // Process supplements in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < supplements.length; i += batchSize) {
      const batch = supplements.slice(i, i + batchSize);
      
      // Prepare the batch insert with ON CONFLICT DO NOTHING to handle duplicates
      const values = batch.map(name => ({
        name,
        category: getCategory(name)
      }));

      // Use raw SQL to handle the unique constraint properly
      await db.execute(sql`
        INSERT INTO supplement_reference (name, category)
        SELECT x.name, x.category
        FROM jsonb_to_recordset(${JSON.stringify(values)}::jsonb) AS x(name text, category text)
        ON CONFLICT (name) DO NOTHING
      `);

      logger.info(`Processed batch ${i / batchSize + 1} of ${Math.ceil(supplements.length / batchSize)}`);
    }

    logger.info("Successfully completed migration: Add expanded supplements list");
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
      logger.info('Running expanded supplements migration...');
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