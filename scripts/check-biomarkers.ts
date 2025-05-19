import { db } from '../db';
import { labResults, biomarkerResults } from '../db/schema';
import { eq } from 'drizzle-orm';
import logger from '../server/utils/logger';

async function checkBiomarkerData(labResultId: number) {
  try {
    // Check lab results metadata
    const [labResult] = await db
      .select({
        id: labResults.id,
        metadata: labResults.metadata,
        biomarkers: biomarkerResults
      })
      .from(labResults)
      .leftJoin(biomarkerResults, eq(biomarkerResults.labResultId, labResults.id))
      .where(eq(labResults.id, labResultId));

    if (!labResult) {
      console.log('Lab result not found');
      return;
    }

    // Log metadata content
    console.log('\nLab Result Metadata:');
    console.log('--------------------');
    console.log('ID:', labResult.id);
    console.log('Has Biomarkers in Metadata:', !!labResult.metadata?.biomarkers);
    console.log('Has PreprocessedText:', !!labResult.metadata?.preprocessedText);
    console.log('Biomarker JSON:', JSON.stringify(labResult.metadata?.biomarkers, null, 2));

    // Get all biomarker results
    const biomarkers = await db
      .select()
      .from(biomarkerResults)
      .where(eq(biomarkerResults.labResultId, labResultId))
      .orderBy(biomarkerResults.name);

    console.log('\nBiomarker Results:');
    console.log('-----------------');
    console.log('Total Biomarkers:', biomarkers.length);
    console.log('Unique Biomarkers:', new Set(biomarkers.map(b => b.name)).size);
    
    // Group by category
    const byCategory = biomarkers.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nBiomarkers by Category:');
    console.log('---------------------');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`${category}: ${count}`);
    });

    // Sample of first few biomarkers
    console.log('\nSample Biomarkers:');
    console.log('-----------------');
    biomarkers.slice(0, 5).forEach(b => {
      console.log(`${b.name}: ${b.value} ${b.unit} (${b.status || 'No Status'})`);
    });

  } catch (error) {
    console.error('Error checking biomarker data:', error);
  } finally {
    process.exit(0);
  }
}

// Run check for lab result 92
checkBiomarkerData(92); 