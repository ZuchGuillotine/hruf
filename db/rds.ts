import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { supplementReference } from "./schema";

/**
 * Database: AWS RDS (stacktrackertest1)
 * Purpose: Supplement name autocomplete with fuzzy search
 * Features: pg_trgm extension enabled
 * Tables: supplement_reference
 * 
 * NOTE: This database is SEPARATE from:
 * 1. NeonDB (Replit) - Core user data & health stats
 * 2. STusertest (AWS RDS) - Supplement & chat logging
 */

if (!process.env.AWS_RDS_URL) {
  throw new Error("AWS_RDS_URL must be set for supplement reference database");
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

const getRootUrl = (url: string) => {
  const match = url.match(/(postgres:\/\/[^:]+:[^@]+@[^:]+:\d+)\/.*/);
  return match ? match[1] + '/postgres' : url;
};

const poolConfig = {
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require',
    ssl: true,
    sslConnectTimeout: 10000
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
  max: 1,
  keepAlive: true,
  keepalives: 1,
  keepalives_idle: 30,
  keepAliveInitialDelayMillis: 5000,
  statement_timeout: 120000,
  query_timeout: 120000,
  application_name: 'supplement-reference-autocomplete',
  retry_strategy: {
    retries: 5,
    factor: 1.5,
    minTimeout: 2000,
    maxTimeout: 120000
  },
  tcp_keepalive: true,
  tcp_keepalive_time: 60,
  tcp_keepalive_interval: 30,
  tcp_keepalive_count: 5
};

const rdsUrl = ensureCorrectProtocol(process.env.AWS_RDS_URL);
const rootUrl = getRootUrl(rdsUrl);

const getConnectionString = (url: string) => {
  const parsed = new URL(url);
  return `postgres://${parsed.username}:${parsed.password}@${parsed.hostname}:${parsed.port}${parsed.pathname}?sslmode=require&connect_timeout=10&application_name=supplement-reference-autocomplete`;
};

const rootPool = new Pool({
  connectionString: getConnectionString(rootUrl),
  ...poolConfig
});

const pool = new Pool({
  connectionString: getConnectionString(rdsUrl),
  ...poolConfig
});

pool.on('connect', (client) => {
  console.log('Connected to stacktrackertest1 (Autocomplete RDS):', {
    timestamp: new Date().toISOString(),
    database: pool.options.database,
    host: pool.options.host,
    port: pool.options.port,
    user: pool.options.user,
  });
});

pool.on('error', (err) => {
  console.error('Error in stacktrackertest1 (Autocomplete RDS):', {
    message: err instanceof Error ? err.message : String(err),
    code: err instanceof Error && 'code' in err ? (err as any).code : undefined,
    stack: err instanceof Error ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

export const rdsDb = drizzle(pool);