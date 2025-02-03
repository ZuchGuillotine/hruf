import { rdsDb, createDatabaseIfNotExists } from "./rds";
import { supplementReference } from "./schema";
import { sql } from "drizzle-orm";

async function verifyRdsTable() {
  console.log('Starting RDS verification...');
  console.log('Replit IP Address: 34.148.196.141'); // Log Replit's IP for reference

  try {
    // First ensure database exists
    console.log('Ensuring database exists...');
    await createDatabaseIfNotExists();

    console.log('Attempting to query supplement reference table...');

    // First try a simple connection test
    const result = await rdsDb.execute(sql`SELECT 1`);
    console.log('Basic connection test successful');

    // Then try to query the actual table
    const supplements = await rdsDb.select().from(supplementReference);
    console.log("Successfully connected to RDS!");
    console.log(`Found ${supplements.length} supplements in the table`);

    // Print first few entries as sample
    if (supplements.length > 0) {
      console.log("\nSample entries:");
      supplements.slice(0, 3).forEach(supp => {
        console.log(`- ${supp.name} (${supp.category})`);
      });
    }
  } catch (error: any) {
    console.error("Error connecting to RDS:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      address: error.address,
      port: error.port,
      stack: error.stack
    });

    // Check if AWS_RDS_URL is properly set and formatted
    const rdsUrl = process.env.AWS_RDS_URL || '';
    console.log('RDS URL format check:', {
      hasProtocol: rdsUrl.startsWith('postgres://') || rdsUrl.startsWith('postgresql://'),
      containsHost: rdsUrl.includes('@'),
      containsPort: /:\d+\//.test(rdsUrl),
      containsDatabase: /\/[^/]+$/.test(rdsUrl)
    });

    // Additional connection troubleshooting info
    console.log('Connection troubleshooting info:', {
      sslEnabled: true,
      connectionTimeout: '60 seconds',
      retryAttempts: 'Using connection pool',
      possibleIssues: [
        'Security group not allowing connections',
        'VPC configuration blocking access',
        'Database instance not running',
        'Network connectivity issues'
      ],
      networkInfo: {
        hostname: error.address,
        port: error.port,
        errorCode: error.code,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      }
    });

    // Check if it's a timeout error and provide specific guidance
    if (error.code === 'ETIMEDOUT' || error.code === 'CONNECT_TIMEOUT') {
      console.log('\nTimeout Error Detected: This usually indicates one of these issues:');
      console.log('1. Network latency between Replit and AWS RDS is too high');
      console.log('2. AWS RDS security group might need updating');
      console.log('3. The database instance might be in a different region');
    }
  } finally {
    process.exit();
  }
}

verifyRdsTable();