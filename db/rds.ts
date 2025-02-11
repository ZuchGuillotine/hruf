import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";

if (!process.env.AWS_RDS_URL) {
  throw new Error("AWS_RDS_URL must be set for RDS database connection");
}

const ensureCorrectProtocol = (url: string) => {
  if (url.startsWith('postgresql://')) {
    return url.replace('postgresql://', 'postgres://');
  }
  if (!url.startsWith('postgres://')) {
    return `postgres://${url}`;
  }
  return url;
};

const poolConfig = {
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'prefer',
  },
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 30000,
  max: 5,
  keepAlive: true,
  statement_timeout: 30000,
  query_timeout: 30000,
  application_name: 'stacktracker-rds',
  keepaliveInitialDelayMillis: 10000
};

const rdsUrl = ensureCorrectProtocol(process.env.AWS_RDS_URL);

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
export const rdsDb = drizzle(pool);