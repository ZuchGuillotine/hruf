import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { supplementReference, supplementLogs, qualitativeLogs } from "./schema";

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

// Event handlers after pool initialization
pool.on('connect', async (client) => {
  console.log('Connected to RDS:', {
    timestamp: new Date().toISOString(),
    database: pool.options.database,
    host: pool.options.host,
    port: pool.options.port,
  });

  try {
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Available tables:', tables.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error checking tables:', err);
  }
});

pool.on('error', (err) => {
  console.error('RDS Pool Error:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
});

export const rdsDb = drizzle(pool);