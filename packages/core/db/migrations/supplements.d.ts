/**
 * Initial supplement reference data
 * This data serves as the base dataset for the supplement autocomplete feature
 * Categories are used for organizing supplements in the UI and filtering
 */
export declare const initialSupplements: {
  name: string;
  category: string;
}[];
/**
 * Seed function for populating the supplement reference database
 * This is used by the autocomplete feature when users are adding supplements
 *
 * Features:
 * - Checks for existing data to prevent duplicate seeding
 * - Performs batch inserts for better performance
 * - Includes comprehensive error handling and logging
 *
 * Note: This is different from the supplement logs database (RDS)
 * which stores actual user supplement intake data.
 */
export declare function seedSupplements(): Promise<void>;
//# sourceMappingURL=supplements.d.ts.map
