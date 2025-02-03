
import { rdsDb } from "./rds";
import { supplementReference } from "./schema";

async function verifyRdsTable() {
  try {
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
  } catch (error) {
    console.error("Error connecting to RDS:", error);
  } finally {
    process.exit();
  }
}

verifyRdsTable();
