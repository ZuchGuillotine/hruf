import { rdsDb } from "./rds";
import { supplementReference } from "./schema";

async function verifyRdsTable() {
  console.log('Starting RDS verification...');

  try {
    console.log('Attempting to query supplement reference table...');
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
      sslEnabled: true, // We're using SSL in the connection options
      connectionTimeout: '30 seconds',
      retryAttempts: 3,
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
  } finally {
    process.exit();
  }
}

verifyRdsTable();