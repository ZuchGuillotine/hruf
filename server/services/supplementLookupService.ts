import { db } from '../../db';
import { supplements, supplementLogs } from '../../db/schema';
import { eq, and, desc, like, or, gte } from 'drizzle-orm';
import logger from '../utils/logger';

interface SupplementLog {
  supplementId: number | null;
  supplementName: string | null;
  dosage: string | null;
  frequency: string | null;
  takenAt: Date | null;
  notes: string | null;
  effects: {
    mood?: number;
    energy?: number;
    sleep?: number;
    sideEffects?: string[];
  } | null;
}

/**
 * Service for directly looking up supplement information
 * without relying on vector search
 */
class SupplementLookupService {
  /**
   * Find logs for a specific supplement by name
   * @param userId - The ID of the user
   * @param supplementName - Name of the supplement to search for
   * @param dayLimit - Number of days to look back (default: 30)
   * @returns Array of supplement logs
   */
  async findSupplementLogs(
    userId: number,
    supplementName: string,
    dayLimit: number = 30
  ): Promise<SupplementLog[]> {
    try {
      logger.info(`Looking up logs for supplement "${supplementName}" for user ${userId}`);

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dayLimit);

      // Create search terms with LIKE queries for fuzzy matching
      const searchTerms = supplementName
        .split(' ')
        .filter((term) => term.length > 2)
        .map((term) => term.trim())
        .filter(Boolean);

      if (searchTerms.length === 0) {
        searchTerms.push(supplementName); // Use full name if no valid terms
      }

      // Build OR condition for each search term
      const searchConditions = searchTerms.map((term) => like(supplements.name, `%${term}%`));

      // Execute query
      const logs = await db
        .select({
          supplementId: supplementLogs.supplementId,
          supplementName: supplements.name,
          dosage: supplements.dosage,
          frequency: supplements.frequency,
          takenAt: supplementLogs.takenAt,
          notes: supplementLogs.notes,
          effects: supplementLogs.effects,
        })
        .from(supplementLogs)
        .leftJoin(supplements, eq(supplements.id, supplementLogs.supplementId))
        .where(
          and(
            eq(supplementLogs.userId, userId),
            gte(supplementLogs.takenAt, cutoffDate),
            or(...searchConditions)
          )
        )
        .orderBy(desc(supplementLogs.takenAt))
        .limit(10);

      logger.info(`Found ${logs.length} logs for supplement "${supplementName}"`);

      return logs;
    } catch (error) {
      logger.error(`Error finding supplement logs:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        supplementName,
      });
      return [];
    }
  }

  /**
   * Parse user query to identify supplement names
   * @param query - The user's query string
   * @returns Array of identified supplement names
   */
  extractSupplementNames(query: string): string[] {
    // List of common supplements to check for
    const commonSupplements = [
      'creatine',
      'vitamin d',
      'vitamin c',
      'vitamin b',
      'magnesium',
      'zinc',
      'omega-3',
      'fish oil',
      'protein',
      'pre-workout',
      'bcaa',
      'glutamine',
      'collagen',
      'probiotics',
      'melatonin',
    ];

    const queryLower = query.toLowerCase().trim();
    return commonSupplements.filter((supplement) => queryLower.includes(supplement.toLowerCase()));
  }

  /**
   * Enhanced context building helper
   * Directly finds relevant supplements from query
   * @param userId - The ID of the user
   * @param query - The user's query string
   * @returns Formatted context string containing supplement information
   */
  async getSupplementContext(userId: number, query: string): Promise<string> {
    try {
      // Extract potential supplement names from query
      const supplementNames = this.extractSupplementNames(query);

      if (supplementNames.length === 0) {
        logger.info('No specific supplements identified in query');
        return '';
      }

      logger.info(`Identified supplements in query: ${supplementNames.join(', ')}`);

      // Get logs for each identified supplement
      let contextContent = '';

      for (const name of supplementNames) {
        const logs = await this.findSupplementLogs(userId, name);

        if (logs.length > 0) {
          contextContent += `Supplement History for ${name}:\n`;

          logs.forEach((log) => {
            const effectsText = log.effects
              ? Object.entries(log.effects)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')
              : 'No effects recorded';

            const logDate = log.takenAt
              ? new Date(log.takenAt).toLocaleDateString()
              : 'Unknown Date';

            contextContent +=
              `[${logDate}] ${log.supplementName || name}, ` +
              `Dosage: ${log.dosage || 'Not specified'}, ` +
              `Frequency: ${log.frequency || 'Not specified'}, ` +
              `Effects: ${effectsText}\n`;
          });

          contextContent += '\n';
        }
      }

      return contextContent;
    } catch (error) {
      logger.error('Error getting supplement context:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        query,
      });
      return '';
    }
  }
}

// Export singleton instance
export const supplementLookupService = new SupplementLookupService();
