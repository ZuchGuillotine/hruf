import { rdsDb } from "./rds";
import { supplementReference } from "./rds-schema";
import { sql } from "drizzle-orm";

// Verify and parse RDS URL
function verifyRdsUrl(url: string | undefined): { host: string, port: number, database: string } {
  if (!url) {
    throw new Error('AWS_RDS_PROXY_ENDPOINT environment variable is not set');
  }

  console.log('Verifying proxy endpoint:', url);
  const matches = url.match(/^([^:]+):(\d+)$/);
  if (!matches) {
    throw new Error('Invalid proxy endpoint format. Expected format: hostname:port');
  }

  const [_, host, portStr] = matches;
  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    throw new Error('Invalid port number in proxy endpoint');
  }

  return { host, port, database: 'stacktracker1' };
}

async function verifyRdsConnection() {
  try {
    console.log('Starting RDS proxy connection verification...');

    // Verify environment variables
    console.log('Checking required environment variables...');
    const requiredVars = [
      'AWS_RDS_PROXY_ENDPOINT',
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ];

    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    console.log('All required environment variables are present');

    const proxyEndpoint = process.env.AWS_RDS_PROXY_ENDPOINT;
    if (!proxyEndpoint) {
      throw new Error('AWS_RDS_PROXY_ENDPOINT environment variable is not set');
    }

    // Log actual connection details
    const { host, port, database } = verifyRdsUrl(proxyEndpoint);
    console.log('Connection details:', {
      host,
      port,
      database,
      region: process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    });

    // Test basic connectivity with detailed logging
    console.log('Testing basic connectivity...');
    try {
      await Promise.race([
        rdsDb.execute(sql`SELECT 1`),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 30s')), 30000)
        )
      ]);
      console.log('Basic connection test successful');
    } catch (error) {
      console.error('Basic connection test failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }

    // If basic connection succeeds, test specific tables
    console.log('Testing table access...');
    const tableTests = [
      {
        name: 'supplement_reference',
        test: async () => {
          const result = await rdsDb.select().from(supplementReference).limit(1);
          return `Found ${result.length} rows`;
        }
      },
      {
        name: 'supplement_logs',
        test: async () => {
          const result = await rdsDb.execute(sql`SELECT COUNT(*) FROM supplement_logs`);
          return 'Table exists and is accessible';
        }
      },
      {
        name: 'qualitative_logs',
        test: async () => {
          const result = await rdsDb.execute(sql`SELECT COUNT(*) FROM qualitative_logs`);
          return 'Table exists and is accessible';
        }
      }
    ];

    for (const { name, test } of tableTests) {
      try {
        console.log(`Testing ${name} table...`);
        const result = await test();
        console.log(`${name} test successful:`, result);
      } catch (error) {
        console.error(`${name} test failed:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    }

    console.log('All RDS tables verified successfully');
    return true;
  } catch (error) {
    console.error("RDS Verification Error:", {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

verifyRdsConnection()
  .then((success) => {
    console.log(success ? "RDS verification completed successfully" : "RDS verification failed");
    process.exit(success ? 0 : 1);
  });