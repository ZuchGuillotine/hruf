import { rdsDb } from "./rds";
import { supplementReference } from "./schema";
import { sql } from "drizzle-orm";

// Verify and parse RDS endpoint
function verifyRdsEndpoint(endpoint: string | undefined): { host: string, port: number } {
  if (!endpoint) {
    throw new Error('AWS_RDS_PROXY_ENDPOINT environment variable is not set');
  }

  const [host, portStr] = endpoint.split(':');
  if (!host) {
    throw new Error('Invalid RDS endpoint format - missing hostname');
  }

  const port = parseInt(portStr || '5432', 10);
  if (isNaN(port)) {
    throw new Error('Invalid port number in RDS endpoint');
  }

  return { host, port };
}

async function verifyRdsConnection() {
  try {
    console.log('Verifying RDS connection and tables...');
    const proxyEndpoint = process.env.AWS_RDS_PROXY_ENDPOINT;
    if (!proxyEndpoint) {
      throw new Error('AWS_RDS_PROXY_ENDPOINT environment variable is not set');
    }

    // Log actual connection details
    const { host, port } = verifyRdsEndpoint(proxyEndpoint);
    console.log(`Attempting to connect to ${host}:${port}`);

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