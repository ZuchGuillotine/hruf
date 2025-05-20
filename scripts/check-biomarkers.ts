import { db } from '../db';
import { labResults, biomarkerResults, biomarkerProcessingStatus } from '../db/schema';
import { eq, isNull, or, and } from 'drizzle-orm';
import { biomarkerExtractionService } from '../server/services/biomarkerExtractionService';
import logger from '../server/utils/logger';

async function checkAndReprocessBiomarkers() {
  try {
    logger.info('Starting biomarker data check and reprocessing');

    // Find labs with missing biomarker data
    const labsWithoutBiomarkers = await db
      .select({
        id: labResults.id,
        uploadedAt: labResults.uploadedAt,
        fileName: labResults.fileName
      })
      .from(labResults)
      .leftJoin(biomarkerResults, eq(biomarkerResults.labResultId, labResults.id))
      .leftJoin(biomarkerProcessingStatus, eq(biomarkerProcessingStatus.labResultId, labResults.id))
      .where(
        and(
          // No biomarker results
          isNull(biomarkerResults.id),
          or(
            // No processing status
            isNull(biomarkerProcessingStatus.labResultId),
            // Or processing never completed/failed
            or(
              eq(biomarkerProcessingStatus.status, 'error'),
              eq(biomarkerProcessingStatus.status, 'processing')
            )
          ),
          // Only check labs from last 30 days to limit scope
          labResults.uploadedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )
      );

    if (labsWithoutBiomarkers.length === 0) {
      logger.info('No labs found requiring biomarker reprocessing');
      return;
    }

    logger.info(`Found ${labsWithoutBiomarkers.length} labs requiring biomarker processing`);

    // Process each lab
    for (const lab of labsWithoutBiomarkers) {
      try {
        logger.info(`Processing lab ${lab.id} (${lab.fileName})`);

        // Check if already attempted
        const [processingStatus] = await db
          .select()
          .from(biomarkerProcessingStatus)
          .where(eq(biomarkerProcessingStatus.labResultId, lab.id))
          .limit(1);

        if (processingStatus?.metadata?.retryCount > 0) {
          logger.info(`Skipping lab ${lab.id} - already attempted reprocessing`);
          continue;
        }

        // Attempt processing
        await biomarkerExtractionService.processLabResult(lab.id);

        logger.info(`Successfully processed lab ${lab.id}`);
      } catch (error) {
        logger.error(`Failed to process lab ${lab.id}:`, {
          error: error instanceof Error ? error.message : String(error),
          labId: lab.id,
          fileName: lab.fileName
        });
      }
    }

    logger.info('Completed biomarker reprocessing check');

  } catch (error) {
    logger.error('Error in biomarker reprocessing script:', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAndReprocessBiomarkers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { checkAndReprocessBiomarkers };