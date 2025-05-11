
import express from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { labResults } from '../../db/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';

const router = express.Router();

const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val ?? '1', 10))
    .refine((n) => n > 0, { message: 'page must be positive' }),
  pageSize: z
    .string()
    .optional()
    .transform((val) => parseInt(val ?? '50', 10))
    .refine((n) => n > 0 && n <= 100, { message: 'pageSize must be between 1 and 100' }),
  biomarker: z.string().optional(),
});

type ChartEntry = {
  name: string;
  value: number;
  unit: string;
  testDate: string;
  category?: string;
};

router.get('/', async (req, res) => {
  try {
    // Validate & coerce query params
    const { page, pageSize, biomarker } = querySchema.parse(req.query);
    const offset = (page - 1) * pageSize;

    // Get lab results with biomarker data
    const results = await db
      .select()
      .from(labResults)
      .where(eq(labResults.userId, req.user!.id))
      .orderBy(labResults.uploadedAt)
      .offset(offset)
      .limit(pageSize);

    // Extract and flatten biomarkers
    const data: ChartEntry[] = results.flatMap(lab => {
      const biomarkers = lab.metadata?.biomarkers?.parsedBiomarkers;
      if (!Array.isArray(biomarkers)) return [];
      
      return biomarkers
        .filter(b => !biomarker || b.name === biomarker)
        .map(b => ({
          name: b.name,
          value: typeof b.value === 'number' ? b.value : Number(b.value),
          unit: b.unit,
          testDate: b.testDate || lab.uploadedAt.toISOString(),
          category: b.category
        }));
    });

    logger.info('Retrieved lab chart data:', {
      userId: req.user!.id,
      resultCount: results.length,
      biomarkerCount: data.length,
      page,
      pageSize
    });

    res.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total: data.length
      }
    });

  } catch (error) {
    logger.error('Error retrieving lab chart data:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(400).json({
      success: false,
      error: 'Failed to retrieve lab chart data',
      data: []
    });
  }
});

export default router;
