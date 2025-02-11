import pkg from 'pg';
const { Pool, PoolConfig } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Get RDS connection URL from environment
const rdsUrl = process.env.AWS_RDS_URL;

if (!rdsUrl) {
  throw new Error('AWS_RDS_URL environment variable is required');
}

// Enhanced pool configuration for better stability
const poolConfig: PoolConfig = {
  connectionTimeoutMillis: 10000, // Connection timeout
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  max: 20, // Maximum number of clients in the pool
  keepAlive: true, // Keep connections alive
  statement_timeout: 30000, // Statement timeout in milliseconds
};

const pool = new Pool({
  connectionString: rdsUrl,
  ...poolConfig
});

// Event handlers for connection monitoring
pool.on('connect', async (client) => {
  console.log('Connected to RDS:', {
    timestamp: new Date().toISOString(),
    database: pool.options.database,
    host: pool.options.host,
    port: pool.options.port,
  });

  try {
    // Initialize supplement_logs table on RDS if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS supplement_logs (
        id SERIAL PRIMARY KEY,
        supplement_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        taken_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        effects JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_effects CHECK (effects IS NULL OR jsonb_typeof(effects) = 'object')
      );

      CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_id 
        ON supplement_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_supplement_logs_taken_at 
        ON supplement_logs (taken_at);
      CREATE INDEX IF NOT EXISTS idx_supplement_logs_supplement_id 
        ON supplement_logs (supplement_id);
    `);

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Available RDS tables:', tables.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error checking/initializing RDS tables:', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

pool.on('error', (err: Error & { code?: string, detail?: string }) => {
  console.error('RDS Pool Error:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
});

// Export RDS connection for supplement logs only
export const rdsDb = drizzle(pool, { schema });
export { pool as rdsPool };