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
  connectionTimeoutMillis: 5000, // Reduced connection timeout
  idleTimeoutMillis: 10000, // Reduced idle timeout
  max: 10, // Reduced max connections
  min: 2, // Minimum pool size
  keepAlive: true,
  keepaliveInitialDelayMillis: 5000,
  statement_timeout: 5000,
  query_timeout: 5000,
  allowExitOnIdle: true
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

pool.on('error', async (err: Error & { code?: string, detail?: string }) => {
  console.error('RDS Pool Error:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Attempt to handle connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    try {
      console.log('Attempting to recover pool connection...');
      const client = await pool.connect();
      client.release();
      console.log('Pool connection recovered');
    } catch (recoverError) {
      console.error('Failed to recover pool connection:', recoverError);
    }
  }
});

// Add connect success handler
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('RDS Client Error:', {
      message: err.message,
      code: 'code' in err ? err.code : undefined,
      timestamp: new Date().toISOString()
    });
  });
});

// Export RDS connection for supplement logs only
export const rdsDb = drizzle(pool, { schema });
export { pool as rdsPool };