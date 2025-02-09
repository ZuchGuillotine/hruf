import postgres from 'pg';
const { Pool } = postgres;

const supplementPool = new Pool({
  host: process.env.SUPPLEMENT_RDS_HOST,
  port: parseInt(process.env.SUPPLEMENT_RDS_PORT || '5432'),
  database: process.env.SUPPLEMENT_RDS_DATABASE,
  user: process.env.SUPPLEMENT_RDS_USER,
  password: process.env.SUPPLEMENT_RDS_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // Increased timeout
  // Required for AWS RDS connection from Replit
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  // Additional debug settings
  statement_timeout: 10000,
  query_timeout: 10000
});

// Log connection details
console.log('Attempting to connect with:', {
  host: process.env.SUPPLEMENT_RDS_HOST,
  port: process.env.SUPPLEMENT_RDS_PORT,
  database: process.env.SUPPLEMENT_RDS_DATABASE,
  user: process.env.SUPPLEMENT_RDS_USER,
  ssl: true
});

// Log connection details (excluding sensitive info)
console.log('Supplement RDS Connection Config:', {
  host: process.env.SUPPLEMENT_RDS_HOST,
  port: process.env.SUPPLEMENT_RDS_PORT,
  database: process.env.SUPPLEMENT_RDS_DATABASE,
  user: process.env.SUPPLEMENT_RDS_USER
});

import { drizzle } from 'drizzle-orm/node-postgres';

export const supplementRdsDb = drizzle(supplementPool);

// Verify connection
supplementPool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to supplement RDS:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  } else {
    console.log('Successfully connected to supplement RDS database');
  }
});

// Handle pool errors
supplementPool.on('error', (err) => {
  console.error('Unexpected error on supplement RDS idle client:', {
    error: err instanceof Error ? err.message : String(err),
    code: err instanceof Error && 'code' in err ? (err as any).code : undefined,
    errno: err instanceof Error && 'errno' in err ? (err as any).errno : undefined,
    address: err instanceof Error && 'address' in err ? (err as any).address : undefined,
    port: err instanceof Error && 'port' in err ? (err as any).port : undefined,
    stack: err instanceof Error ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// Add connection event logging
supplementPool.on('connect', (client) => {
  console.log('New client connected to supplement RDS:', {
    host: process.env.SUPPLEMENT_RDS_HOST,
    database: process.env.SUPPLEMENT_RDS_DATABASE,
    timestamp: new Date().toISOString()
  });
});