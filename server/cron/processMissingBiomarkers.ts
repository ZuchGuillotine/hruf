import { CronJob } from 'node-cron';
import { checkAndReprocessBiomarkers } from '../../scripts/check-biomarkers';
import logger from '../utils/logger';

// Run daily at 2 AM
const processMissingBiomarkersCron = new CronJob('0 2 * * *', async () => {
  try {
    logger.info('Starting scheduled biomarker reprocessing check');
    await checkAndReprocessBiomarkers();
    logger.info('Completed scheduled biomarker reprocessing check');
  } catch (error) {
    logger.error('Error in biomarker reprocessing cron:', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default processMissingBiomarkersCron;