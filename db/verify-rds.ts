import { rdsDb } from "./rds";
import { supplementReference } from "./schema";
import { sql } from "drizzle-orm";

async function verifyRdsConnection() {
  try {
    console.log('Verifying RDS connection and tables...');

    // Test general connectivity
    await rdsDb.execute(sql`SELECT 1`);
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