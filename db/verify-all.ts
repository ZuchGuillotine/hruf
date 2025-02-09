
import { db } from "./index"; // NeonDB
import { rdsDb } from "./rds"; // stacktrackertest1
import { supplementRdsDb } from "./supplement-rds"; // STusertest
import { sql } from "drizzle-orm";

async function verifyNeonDB() {
  console.log("\n=== Verifying NeonDB (Core User Data) ===");
  try {
    const userCount = await db.execute(sql`SELECT COUNT(*) FROM users`);
    const healthStatsCount = await db.execute(sql`SELECT COUNT(*) FROM health_stats`);
    
    console.log("Connection: Success");
    console.log("Users count:", userCount[0].count);
    console.log("Health stats count:", healthStatsCount[0].count);
  } catch (error) {
    console.error("NeonDB Error:", error instanceof Error ? error.message : String(error));
  }
}

async function verifyAutocompleteRDS() {
  console.log("\n=== Verifying stacktrackertest1 (Autocomplete RDS) ===");
  try {
    // Check pg_trgm extension
    const extensions = await rdsDb.execute(sql`
      SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'
    `);
    
    const supplementCount = await rdsDb.execute(sql`
      SELECT COUNT(*) FROM supplement_reference
    `);
    
    console.log("Connection: Success");
    console.log("pg_trgm extension:", extensions.length > 0 ? "Enabled" : "Disabled");
    console.log("Supplement references count:", supplementCount[0].count);
  } catch (error) {
    console.error("Autocomplete RDS Error:", error instanceof Error ? error.message : String(error));
  }
}

async function verifyLoggingRDS() {
  console.log("\n=== Verifying STusertest (Logging RDS) ===");
  try {
    const logCount = await supplementRdsDb.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM supplement_logs) as supplement_logs,
        (SELECT COUNT(*) FROM qualitative_logs) as chat_logs
    `);
    
    console.log("Connection: Success");
    console.log("Supplement logs count:", logCount[0].supplement_logs);
    console.log("Chat logs count:", logCount[0].chat_logs);
  } catch (error) {
    console.error("Logging RDS Error:", error instanceof Error ? error.message : String(error));
  }
}

async function verifyAllDatabases() {
  console.log("Starting database verification...");
  console.log("Timestamp:", new Date().toISOString());
  
  await verifyNeonDB();
  await verifyAutocompleteRDS();
  await verifyLoggingRDS();
  
  console.log("\nVerification complete!");
}

verifyAllDatabases()
  .catch(console.error)
  .finally(() => process.exit());
