import express from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { labResults, biomarkerResults } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import logger from '../utils/logger';

const router = express.Router();

const querySchema = z.object({
  biomarkers: z.string().optional().transform(val => val?.split(',').filter(Boolean) || []),
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
});

async function getBiomarkerChartData(userId: number, biomarkerNames: string[]) {
  return db
    .select({
      name: biomarkerResults.name,
      value: biomarkerResults.value,
      unit: biomarkerResults.unit,
      testDate: biomarkerResults.testDate,
      category: biomarkerResults.category,
      status: biomarkerResults.status
    })
    .from(biomarkerResults)
    .innerJoin(labResults, eq(biomarkerResults.labResultId, labResults.id))
    .where(
      and(
        eq(labResults.userId, userId),
        biomarkerNames.length > 0 ? inArray(biomarkerResults.name, biomarkerNames) : undefined
      )
    )
    .orderBy(biomarkerResults.testDate);
}

router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required'
      });
    }

    // Validate & coerce query params
    const { biomarkers, page, pageSize } = querySchema.parse(req.query);
    const offset = (page - 1) * pageSize;

    // Get biomarker data
    const data = await getBiomarkerChartData(req.user.id, biomarkers);

    logger.info('Retrieved biomarker chart data:', {
      userId: req.user.id,
      biomarkerCount: data.length,
      requestedBiomarkers: biomarkers,
      page,
      pageSize
    });

    // Apply pagination
    const paginatedData = data.slice(offset, offset + pageSize);

    res.json({
      success: true,
      data: paginatedData,
      hasBiomarkers: data.length > 0,
      pagination: {
        page,
        pageSize,
        total: data.length
      }
    });

  } catch (error) {
    logger.error('Error retrieving biomarker chart data:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(400).json({
      success: false,
      error: 'Failed to retrieve biomarker chart data',
      data: []
    });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const biomarkerNames = req.query.names ? String(req.query.names).split(',') : [];

    const data = await getBiomarkerChartData(req.user!.id, biomarkerNames);

    // Process and aggregate trends
    const trends = biomarkerNames.map(name => {
      const series = data
        .filter(b => b.name === name)
        .map(b => ({
          date: b.testDate.toISOString(),
          value: b.value
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        name,
        series
      };
    });

    logger.info('Retrieved biomarker trends:', {
      userId: req.user!.id,
      biomarkers: biomarkerNames,
      trendPoints: trends.reduce((sum, t) => sum + t.series.length, 0)
    });

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    logger.error('Error retrieving biomarker trends:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(400).json({
      success: false,
      error: 'Failed to retrieve biomarker trends',
      data: []
    });
  }
});

export default router;