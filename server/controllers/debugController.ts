
import { Request, Response } from 'express';
import { db } from '../../db';
import { labResults } from '../../db/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';

export const debugLabResults = async (req: Request, res: Response) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { labId } = req.params;
  
  try {
    if (labId) {
      // Get specific lab result
      const [labResult] = await db
        .select()
        .from(labResults)
        .where(eq(labResults.id, parseInt(labId)))
        .limit(1);
      
      if (!labResult) {
        return res.status(404).json({ error: 'Lab result not found' });
      }
      
      // Extract biomarker info for debugging
      const biomarkers = labResult.metadata?.biomarkers?.parsedBiomarkers || [];
      
      return res.status(200).json({
        labResult: {
          id: labResult.id,
          fileName: labResult.fileName,
          uploadedAt: labResult.uploadedAt,
          metadata: {
            biomarkerCount: biomarkers.length,
            biomarkers: biomarkers.map(b => ({
              name: b.name,
              value: b.value,
              unit: b.unit,
              category: b.category
            })),
            extractedAt: labResult.metadata?.biomarkers?.extractedAt,
            hasOcr: !!labResult.metadata?.ocr,
            hasParsedText: !!labResult.metadata?.parsedText
          }
        }
      });
    } else {
      // Get summary of all lab results
      const results = await db
        .select({
          id: labResults.id,
          fileName: labResults.fileName,
          uploadedAt: labResults.uploadedAt,
          userId: labResults.userId,
          metadata: labResults.metadata
        })
        .from(labResults);
      
      const summary = results.map(result => {
        const biomarkers = result.metadata?.biomarkers?.parsedBiomarkers || [];
        return {
          id: result.id,
          fileName: result.fileName,
          uploadedAt: result.uploadedAt,
          userId: result.userId,
          biomarkerCount: biomarkers.length,
          biomarkerNames: biomarkers.map(b => b.name),
          extractedAt: result.metadata?.biomarkers?.extractedAt
        };
      });
      
      return res.status(200).json({ 
        summary,
        totalLabResults: results.length,
        labsWithBiomarkers: summary.filter(s => s.biomarkerCount > 0).length
      });
    }
  } catch (error) {
    logger.error('Error in debug endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
