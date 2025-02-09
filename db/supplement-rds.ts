/**
 * Database: AWS RDS (STusertest)
 * Purpose: Store user-generated logs over time
 * Tables:
 * 1. supplement_logs - Track supplement intake & effects
 * 2. qualitative_logs - Store chat interactions
 * 
 * NOTE: This database is SEPARATE from:
 * 1. NeonDB (Replit) - Core user data & health stats
 * 2. stacktrackertest1 (AWS RDS) - Supplement autocomplete
 */
import postgres from 'pg';
const { Pool } = postgres;

// Configuration for STusertest database
const poolConfig = {
  host: process.env.SUPPLEMENT_RDS_HOST,
  port: parseInt(process.env.SUPPLEMENT_RDS_PORT || '5432'),
  database: process.env.SUPPLEMENT_RDS_DATABASE,
  user: process.env.SUPPLEMENT_RDS_USER,
  password: process.env.SUPPLEMENT_RDS_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require'
  },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 30000,
  application_name: 'supplement-and-chat-logs',
  retry_strategy: {
    retries: 5,
    factor: 1.5,
    minTimeout: 1000,
    maxTimeout: 60000
  }
};

// Diagnostic logging for connection issues
console.log('STusertest Database Configuration:', {
  host: process.env.SUPPLEMENT_RDS_HOST,
  port: process.env.SUPPLEMENT_RDS_PORT,
  database: process.env.SUPPLEMENT_RDS_DATABASE,
  user: process.env.SUPPLEMENT_RDS_USER,
  ssl: true,
  maxConnections: poolConfig.max,
  connectionTimeout: poolConfig.connectionTimeoutMillis,
  retryStrategy: poolConfig.retry_strategy
});

const supplementPool = new Pool(poolConfig);

import { drizzle } from 'drizzle-orm/node-postgres';
export const supplementRdsDb = drizzle(supplementPool);

// Verify database connection and schema
const verifyConnection = async () => {
  try {
    const client = await supplementPool.connect();
    console.log('Connected to STusertest database');

    // Test schema status
    const tables = await client.query(`
      SELECT table_schema, table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('supplement_logs', 'qualitative_logs')
      ORDER BY table_name, ordinal_position;
    `);

    console.log('STusertest Schema Status:', 
      tables.rows.map(r => `${r.table_name}.${r.column_name}: ${r.data_type}`));

    client.release();
    return true;
  } catch (error) {
    console.error('STusertest Connection Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      config: {
        host: process.env.SUPPLEMENT_RDS_HOST,
        port: process.env.SUPPLEMENT_RDS_PORT,
        database: process.env.SUPPLEMENT_RDS_DATABASE
      }
    });
    return false;
  }
};

// Initial connection check
verifyConnection();

supplementPool.on('error', (err) => {
  console.error('STusertest Pool Error:', {
    error: err instanceof Error ? err.message : String(err),
    code: err instanceof Error && 'code' in err ? (err as any).code : undefined,
    stack: err instanceof Error ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Attempt reconnection
  setTimeout(verifyConnection, 5000);
});

export const pool = supplementPool;