
import { db } from '../db';
import { labResults } from '../db/schema';

async function checkLabOCR() {
  const results = await db
    .select()
    .from(labResults);

  console.log('Lab Results OCR Check:');
  console.log('---------------------');
  
  for (const result of results) {
    console.log(`\nFile: ${result.fileName}`);
    console.log(`Type: ${result.fileType}`);
    console.log(`Upload Date: ${result.uploadedAt}`);
    console.log('Metadata:', JSON.stringify(result.metadata, null, 2));
  }
}

checkLabOCR()
  .catch(console.error)
  .finally(() => process.exit());
