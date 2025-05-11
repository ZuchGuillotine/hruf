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
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required'
      });
    }

    // Validate & coerce query params
    const { page, pageSize, biomarker } = querySchema.parse(req.query);
    const offset = (page - 1) * pageSize;

    // Get lab results with biomarker data
    const results = await db
      .select()
      .from(labResults)
      .where(eq(labResults.userId, req.user.id))
      .orderBy(labResults.uploadedAt, 'desc');

    // Log the retrieved data for debugging
    logger.info(`Retrieved ${results.length} lab results for user ${req.user.id}`, {
      userId: req.user.id,
      resultCount: results.length
    });

    // Extract and flatten biomarkers with debug logging
    const data: ChartEntry[] = results.flatMap(lab => {
      const biomarkers = lab.metadata?.biomarkers?.parsedBiomarkers;
      const metadataStructure = {
        hasBiomarkersObject: !!lab.metadata?.biomarkers,
        hasParsedBiomarkers: !!biomarkers,
        biomarkerCount: biomarkers?.length || 0,
        metadataKeys: Object.keys(lab.metadata || {}),
        biomarkerLastExtracted: lab.metadata?.biomarkers?.extractedAt,
        embeddingTimestamp: lab.metadata?.embeddingCreatedAt
      };
      
      logger.debug('Processing lab result biomarkers:', {
        labId: lab.id,
        ...metadataStructure,
        sampleBiomarkers: biomarkers?.slice(0, 2)
      });

      if (!Array.isArray(biomarkers)) {
        logger.warn('Invalid biomarkers data structure:', {
          labId: lab.id,
          metadata: lab.metadata
        });
        return [];
      }

      const entries = biomarkers
        .filter(b => !biomarker || b.name === biomarker)
        .map(b => ({
          name: b.name,
          value: typeof b.value === 'number' ? b.value : Number(b.value),
          unit: b.unit,
          testDate: b.testDate || lab.uploadedAt.toISOString(),
          category: b.category
        }));

      logger.debug('Extracted chart entries:', {
        labId: lab.id,
        entryCount: entries.length
      });

      return entries;
    });

    // Check if we have any biomarkers
    const hasBiomarkers = data.length > 0;

    // Apply pagination after all processing
    const paginatedData = data.slice(offset, offset + pageSize);

    logger.info('Retrieved lab chart data:', {
      userId: req.user.id,
      resultCount: results.length,
      biomarkerCount: data.length,
      hasBiomarkers,
      page,
      pageSize,
      requestedBiomarker: biomarker
    });

    res.json({
      success: true,
      data: paginatedData,
      hasBiomarkers,
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



// GET /api/biomarkers/trends
router.get('/trends', async (req, res) => {
  try {
    const biomarkerNames = req.query.names ? String(req.query.names).split(',') : [];

    // Get all lab results for user
    const results = await db
      .select()
      .from(labResults)
      .where(eq(labResults.userId, req.user!.id))
      .orderBy(labResults.uploadedAt);

    // Process and aggregate trends
    const trends = biomarkerNames.map(name => {
      const series = results.flatMap(lab => {
        const biomarkers = lab.metadata?.biomarkers?.parsedBiomarkers;
        if (!Array.isArray(biomarkers)) return [];

        const biomarker = biomarkers.find(b => b.name === name);
        if (!biomarker) return [];

        return [{
          date: biomarker.testDate || lab.uploadedAt.toISOString(),
          value: typeof biomarker.value === 'number' ? biomarker.value : Number(biomarker.value)
        }];
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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