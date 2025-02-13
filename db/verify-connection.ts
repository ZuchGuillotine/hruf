import { rdsDb } from "./rds";
import { sql } from "drizzle-orm";

async function verifyConnection() {
  try {
    console.log('Starting RDS connection verification...');
    
    const result = await rdsDb.execute(sql`
      SELECT 
        current_user,
        current_database(),
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        inet_client_addr() as client_ip,
        inet_client_port() as client_port,
        version() as postgres_version
    `);
    
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

verifyConnection()
  .then((success) => {
    console.log(`Database verification ${success ? 'succeeded' : 'failed'}`);
    process.exit(success ? 0 : 1);
  });
