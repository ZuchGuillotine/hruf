import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { supplementReference, supplementLogs, qualitativeLogs } from "./schema";

/**
 * Database: AWS RDS
 * Purpose: Combined database for:
 * 1. Supplement reference data (autocomplete/fuzzy search)
 * 2. User supplement intake logs
 * 3. User chat/interaction logs
 * 
 * Features: 
 * - pg_trgm extension for fuzzy search
 * - JSONB for flexible data storage
 * - Optimized indexes for common queries
 */

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
    sslmode: 'require',
    ssl: true,
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
  max: 20, // Increased pool size for multiple tables
  keepAlive: true,
  statement_timeout: 120000,
  query_timeout: 120000,
  application_name: 'stacktracker-rds',
};

const rdsUrl = ensureCorrectProtocol(process.env.AWS_RDS_URL);

const pool = new Pool({
  connectionString: rdsUrl,
  ...poolConfig
});

pool.on('connect', (client) => {
  console.log('Connected to RDS:', {
    timestamp: new Date().toISOString(),
    database: pool.options.database,
    host: pool.options.host,
    port: pool.options.port,
  });
});

pool.on('error', (err) => {
  console.error('RDS Pool Error:', {
    message: err instanceof Error ? err.message : String(err),
    code: err instanceof Error && 'code' in err ? (err as any).code : undefined,
    timestamp: new Date().toISOString()
  });
});

export const rdsDb = drizzle(pool);