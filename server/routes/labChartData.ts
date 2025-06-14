import express from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { labResults, biomarkerResults } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import logger from '../utils/logger';
import { biomarkerExtractionService } from '../services/biomarkerExtractionService';

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
  try {
    logger.info('Retrieving biomarker chart data', {
      userId,
      biomarkerCount: biomarkerNames.length,
      biomarkers: biomarkerNames
    });

    const results = await db
      .select({
        name: biomarkerResults.name,
        value: biomarkerResults.value,
        unit: biomarkerResults.unit,
        testDate: biomarkerResults.testDate,
        category: biomarkerResults.category,
        status: biomarkerResults.status,
        labResultId: biomarkerResults.labResultId
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

    logger.info('Raw database query results:', {
      resultCount: results.length,
      sampleResults: results.slice(0, 5),
      distinctBiomarkers: [...new Set(results.map(r => r.name))],
      dateRange: results.length > 0 ? {
        earliest: results[0].testDate,
        latest: results[results.length - 1].testDate
      } : null
    });

    logger.info('Retrieved biomarker data', {
      userId,
      resultCount: results.length,
      uniqueBiomarkers: [...new Set(results.map(r => r.name))],
      dateRange: results.length > 0 ? {
        start: results[0].testDate,
        end: results[results.length - 1].testDate
      } : null
    });

    // Process and validate data
    const processedResults = results.map(result => {
      const numericValue = typeof result.value === 'string' ? parseFloat(result.value) : result.value;
      
      return {
        name: result.name,
        value: numericValue,
        unit: result.unit || '',
        testDate: result.testDate.toISOString(),
        category: result.category || 'other',
        status: result.status || null,
        labResultId: result.labResultId
      };
    });

    // Validate data integrity
    const invalidResults = processedResults.filter(r => {
      return isNaN(r.value) || !r.unit || !r.testDate || !r.name;
    });

    if (invalidResults.length > 0) {
      logger.warn('Found invalid biomarker results', {
        invalidCount: invalidResults.length,
        examples: invalidResults.slice(0, 3)
      });
    }

    // Filter out invalid results
    const validResults = processedResults.filter(r => 
      !isNaN(r.value) && r.unit && r.testDate && r.name
    );

    logger.info('Processed biomarker data', {
      originalCount: results.length,
      processedCount: processedResults.length,
      validCount: validResults.length,
      invalidCount: invalidResults.length
    });

    return validResults;
  } catch (error) {
    logger.error('Error retrieving biomarker chart data', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

router.get('/', async (req, res) => {
  try {
    if (!req.user?.id) {
      logger.warn('Unauthorized biomarker data access attempt');
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        data: []
      });
    }

    const validationResult = querySchema.safeParse(req.query);
    if (!validationResult.success) {
      logger.warn('Invalid query parameters', {
        errors: validationResult.error.issues,
        query: req.query
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.issues,
        data: []
      });
    }

    const { biomarkers, page, pageSize } = validationResult.data;
    const offset = (page - 1) * pageSize;

    const data = await getBiomarkerChartData(req.user.id, biomarkers);

    logger.info('Retrieved biomarker chart data:', {
      userId: req.user.id,
      biomarkerCount: data.length,
      uniqueBiomarkers: [...new Set(data.map(d => d.name))],
      requestedBiomarkers: biomarkers,
      page,
      pageSize,
      sampleData: data.slice(0, 3) // Log first 3 records for debugging
    });

    const paginatedData = data.slice(offset, offset + pageSize);
    const hasBiomarkers = data.length > 0;

    res.json({
      success: true,
      data: paginatedData,
      hasBiomarkers,
      pagination: {
        page,
        pageSize,
        total: data.length,
        totalPages: Math.ceil(data.length / pageSize)
      },
      metadata: {
        uniqueBiomarkers: [...new Set(data.map(d => d.name))].length,
        categories: [...new Set(data.map(d => d.category))],
        dateRange: data.length > 0 ? {
          earliest: Math.min(...data.map(d => new Date(d.testDate).getTime())),
          latest: Math.max(...data.map(d => new Date(d.testDate).getTime()))
        } : null
      }
    });

  } catch (error) {
    logger.error('Error retrieving biomarker chart data:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve biomarker chart data',
      data: [],
      hasBiomarkers: false
    });
  }
});

router.get('/debug', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get raw biomarker data
    const rawResults = await db
      .select()
      .from(biomarkerResults)
      .innerJoin(labResults, eq(biomarkerResults.labResultId, labResults.id))
      .where(eq(labResults.userId, req.user.id))
      .limit(10);

    // Get a specific lab result's text
    const labId = req.query.labId ? parseInt(req.query.labId as string) : null;
    let labText = null;
    
    if (labId) {
      const [labResult] = await db
        .select()
        .from(labResults)
        .where(and(
          eq(labResults.id, labId),
          eq(labResults.userId, req.user.id)
        ))
        .limit(1);
      
      if (labResult) {
        labText = labResult.metadata?.preprocessedText?.normalizedText || 
                  labResult.metadata?.preprocessedText?.rawText ||
                  'No text found';
      }
    }

    res.json({
      success: true,
      userId: req.user.id,
      rawDataSample: rawResults,
      totalCount: rawResults.length,
      labText: labText ? labText.substring(0, 1000) : null,
      labId: labId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/reprocess/:labId', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const labId = parseInt(req.params.labId);
    
    // Verify the lab result belongs to the user
    const [labResult] = await db
      .select()
      .from(labResults)
      .where(and(
        eq(labResults.id, labId),
        eq(labResults.userId, req.user.id)
      ))
      .limit(1);
    
    if (!labResult) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    // Delete existing biomarkers
    await db
      .delete(biomarkerResults)
      .where(eq(biomarkerResults.labResultId, labId));

    // Reprocess the lab result
    await biomarkerExtractionService.processLabResult(labId);

    // Get the new results
    const newResults = await db
      .select()
      .from(biomarkerResults)
      .where(eq(biomarkerResults.labResultId, labId));

    res.json({
      success: true,
      message: 'Lab result reprocessed',
      labId,
      biomarkerCount: newResults.length,
      biomarkers: newResults.map(r => ({
        name: r.name,
        value: r.value,
        unit: r.unit,
        category: r.category
      }))
    });
  } catch (error) {
    logger.error('Error reprocessing lab result:', {
      labId: req.params.labId,
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reprocess lab result'
    });
  }
});

router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Lab chart data endpoint is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
