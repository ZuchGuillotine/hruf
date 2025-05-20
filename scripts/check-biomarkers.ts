
import { db } from '../db';
import { labResults, biomarkerResults, biomarkerProcessingStatus } from '../db/schema';
import { eq } from 'drizzle-orm';
import logger from '../server/utils/logger';

async function checkBiomarkerData(labResultId: number) {
  try {
    // First check the lab result and its metadata
    const [labResult] = await db
      .select()
      .from(labResults)
      .where(eq(labResults.id, labResultId))
      .limit(1);

    if (!labResult) {
      console.log('Lab result not found');
      return;
    }

    // Check processing status
    const [processingStatus] = await db
      .select()
      .from(biomarkerProcessingStatus)
      .where(eq(biomarkerProcessingStatus.labResultId, labResultId))
      .limit(1);

    console.log('\nProcessing Status:');
    console.log('------------------');
    console.log('Status:', processingStatus?.status);
    console.log('Started At:', processingStatus?.startedAt);
    console.log('Completed At:', processingStatus?.completedAt);
    console.log('Biomarker Count:', processingStatus?.biomarkerCount);

    // Get biomarkers from dedicated table
    const storedBiomarkers = await db
      .select()
      .from(biomarkerResults)
      .where(eq(biomarkerResults.labResultId, labResultId));

    // Get biomarkers from metadata
    const metadataBiomarkers = labResult.metadata?.biomarkers?.parsedBiomarkers || [];

    console.log('\nStorage Comparison:');
    console.log('-------------------');
    console.log('Biomarkers in dedicated table:', storedBiomarkers.length);
    console.log('Biomarkers in metadata:', metadataBiomarkers.length);

    // Check for mismatches
    if (storedBiomarkers.length !== metadataBiomarkers.length) {
      console.log('\n⚠️ Warning: Mismatch between storage locations!');
      console.log('This indicates a potential issue in the storage process.');
    }

    // Show sample of biomarkers from both locations
    console.log('\nSample from biomarker_results table:');
    console.log('----------------------------------');
    storedBiomarkers.slice(0, 3).forEach(b => {
      console.log(`${b.name}: ${b.value} ${b.unit} (${b.status || 'No Status'})`);
    });

    console.log('\nSample from metadata:');
    console.log('--------------------');
    metadataBiomarkers.slice(0, 3).forEach(b => {
      console.log(`${b.name}: ${b.value} ${b.unit}`);
    });

    // Show storage details
    console.log('\nStorage Details:');
    console.log('----------------');
    console.log('Lab ID:', labResult.id);
    console.log('Upload Date:', new Date(labResult.uploadedAt).toLocaleString());
    console.log('Has Preprocessed Text:', !!labResult.metadata?.preprocessedText);
    console.log('Processing Metadata:', JSON.stringify(processingStatus?.metadata, null, 2));

  } catch (error) {
    console.error('Error checking biomarker data:', error);
  }
}

// Run check for provided lab result ID or default to most recent
async function main() {
  try {
    const labId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
    
    if (!labId) {
      // Get most recent lab result
      const [mostRecent] = await db
        .select()
        .from(labResults)
        .orderBy(labResults.uploadedAt, "desc")
        .limit(1);
        
      if (mostRecent) {
        await checkBiomarkerData(mostRecent.id);
      } else {
        console.log('No lab results found');
      }
    } else {
      await checkBiomarkerData(labId);
    }
  } catch (err) {
    console.error('Failed to run biomarker check:', err);
  } finally {
    process.exit(0);
  }
}

main();
