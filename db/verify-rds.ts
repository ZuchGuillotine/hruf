import { rdsDb } from "./rds";
import { supplementReference } from "./schema";
import { sql } from "drizzle-orm";

// Verify and parse RDS URL
function verifyRdsUrl(url: string | undefined): { host: string, port: number, database: string } {
  if (!url) {
    throw new Error('AWS_RDS_URL environment variable is not set');
  }

  const matches = url.match(/postgres:\/\/[^:]+:[^@]+@([^:]+):(\d+)\/(\w+)/);
  if (!matches) {
    throw new Error('Invalid RDS URL format');
  }

  const [_, host, portStr, database] = matches;
  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    throw new Error('Invalid port number in RDS URL');
  }

  return { host, port, database };
}

async function verifyRdsConnection() {
  try {
    console.log('Verifying RDS connection and tables...');
    const rdsUrl = process.env.AWS_RDS_URL;
    if (!rdsUrl) {
      throw new Error('AWS_RDS_URL environment variable is not set');
    }

    // Log actual connection details
    const { host, port, database } = verifyRdsUrl(rdsUrl);
    console.log(`Attempting to connect to ${host}:${port}/${database}`);

    // Test general connectivity with increased timeout
    await Promise.race([
      rdsDb.execute(sql`SELECT 1`),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 30s')), 30000)
      )
    ]);
    console.log('Basic connection successful');

    // Test supplement_reference table
    const supplements = await rdsDb.select().from(supplementReference).limit(1);
    console.log(`Successfully queried supplement_reference table`);

    // Test supplement_logs table
    await rdsDb.execute(sql`SELECT COUNT(*) FROM supplement_logs`);
    console.log('Successfully queried supplement_logs table');

    // Test qualitative_logs table
    await rdsDb.execute(sql`SELECT COUNT(*) FROM qualitative_logs`);
    console.log('Successfully queried qualitative_logs table');

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
    console.log(success ? "RDS verification completed" : "RDS verification failed");
    process.exit(success ? 0 : 1);
  });