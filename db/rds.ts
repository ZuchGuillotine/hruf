import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { RDS } from '@aws-sdk/client-rds';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Signer } from '@aws-sdk/rds-signer';

if (!process.env.AWS_RDS_PROXY_ENDPOINT || !process.env.AWS_REGION) {
  throw new Error("AWS_RDS_PROXY_ENDPOINT and AWS_REGION must be set");
}

const region = process.env.AWS_REGION;
const dbName = process.env.AWS_RDS_DB_NAME || 'stacktrackertest1';
const dbUser = process.env.AWS_RDS_USERNAME || 'postgres';
const proxyEndpoint = process.env.AWS_RDS_PROXY_ENDPOINT || '';
const [host, port] = proxyEndpoint.split(':');

if (!host) {
  throw new Error('AWS_RDS_PROXY_ENDPOINT must include a valid hostname');
}

const poolConfig = {
  database: dbName,
  user: dbUser,
  host: host,
  ssl: {
    rejectUnauthorized: true,
    sslmode: 'require',
  },
  port: parseInt(port || '5432', 10),
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 10,
  password: await getAuthToken(), // Use IAM token as password
  keepAlive: true,
  statement_timeout: 30000,
  query_timeout: 30000,
  application_name: 'stacktracker-rds'
};

// Get IAM auth token for RDS
async function getAuthToken() {
  try {
    const signer = new Signer({
      region,
      hostname: proxyEndpoint,
      port: 5432,
      username: dbUser,
    });
    return await signer.getAuthToken();
  } catch (error) {
    console.error('Failed to get RDS auth token:', error);
    throw error;
  }
}

// Create pool with IAM authentication
let pool: pkg.Pool;

async function createPool() {
  const token = await getAuthToken();
  pool = new Pool({
    ...poolConfig,
    password: token
  });

  // Refresh auth token periodically
  setInterval(async () => {
    try {
      pool.password = await getAuthToken();
    } catch (err) {
      console.error('Failed to refresh RDS auth token:', err);
    }
  }, 15 * 60 * 1000); // Refresh every 15 minutes

  pool.on('error', (err) => {
    console.error('RDS Pool Error:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      timestamp: new Date().toISOString()
    });
  });

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

  return pool;
}

// Initialize pool
const poolPromise = createPool();

// Export RDS connection
export const rdsDb = drizzle(await poolPromise);