import { Request, Response } from 'express';
/**
 * Generate a daily summary for the current user
 */
export declare function generateDailySummary(req: Request, res: Response): Promise<void>;
/**
 * Generate a weekly summary for the specified week
 */
export declare function generateWeeklySummary(req: Request, res: Response): Promise<void>;
/**
 * Retrieve summaries for a date range
 */
export declare function getSummaries(req: Request, res: Response): Promise<void>;
/**
 * Trigger real-time summarization for the current user
 */
export declare function triggerRealtimeSummarization(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=summaryController.d.ts.map
