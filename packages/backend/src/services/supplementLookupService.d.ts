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
declare class SupplementLookupService {
  /**
   * Find logs for a specific supplement by name
   * @param userId - The ID of the user
   * @param supplementName - Name of the supplement to search for
   * @param dayLimit - Number of days to look back (default: 30)
   * @returns Array of supplement logs
   */
  findSupplementLogs(
    userId: number,
    supplementName: string,
    dayLimit?: number
  ): Promise<SupplementLog[]>;
  /**
   * Parse user query to identify supplement names
   * @param query - The user's query string
   * @returns Array of identified supplement names
   */
  extractSupplementNames(query: string): string[];
  /**
   * Enhanced context building helper
   * Directly finds relevant supplements from query
   * @param userId - The ID of the user
   * @param query - The user's query string
   * @returns Formatted context string containing supplement information
   */
  getSupplementContext(userId: number, query: string): Promise<string>;
}
export declare const supplementLookupService: SupplementLookupService;
export {};
//# sourceMappingURL=supplementLookupService.d.ts.map
