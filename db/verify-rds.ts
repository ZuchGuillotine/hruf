import { rdsDb } from "./rds";
import { supplementReference } from "./schema";
import { sql } from "drizzle-orm";

async function verifyRdsConnection() {
  try {
    console.log('Verifying RDS connection and tables...');
    const connectionUrl = process.env.AWS_RDS_URL;
    if (!connectionUrl) {
      throw new Error('AWS_RDS_URL environment variable is not set');
    }
    
    // Parse connection URL to log host/port
    const matches = connectionUrl.match(/postgres:\/\/[^:]+:[^@]+@([^:]+):(\d+)\/\w+/);
    if (!matches) {
      throw new Error('Invalid connection URL format');
    }
    const [_, host, port] = matches;
    console.log(`Attempting to connect to ${host}:${port}`);

    // Test general connectivity with timeout
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