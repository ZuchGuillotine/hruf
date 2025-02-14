import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
// Assuming rdsSchema is defined elsewhere, perhaps in a separate file.  This needs to be added to the project.
import { rdsSchema } from './rds-schema'; // Or the correct path


// Type definitions for better error handling
interface PostgresError extends Error {
  code?: string;
  detail?: string;
  message: string;
}

// Environment validation
const required = [
  'AWS_RDS_HOST',
  'RDS_USERNAME',
  'RDS_PASSWORD'
] as const;

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Configuration
const host = process.env.AWS_RDS_HOST?.trim();
const username = process.env.RDS_USERNAME?.trim();
const password = process.env.RDS_PASSWORD?.trim();
const port = 5432;
const database = 'stacktracker1';

if (!host || !username || !password) {
  throw new Error(`Missing required environment variables:
    ${!host ? 'AWS_RDS_HOST' : ''}
    ${!username ? 'RDS_USERNAME' : ''}
    ${!password ? 'RDS_PASSWORD' : ''}`
  );
}

console.log('Database connection config:', {
  host,
  username,
  database,
  hasPassword: !!password,
  timestamp: new Date().toISOString()
});

console.log('Initializing RDS connection with:', {
  host,
  port,
  username,
  database,
  timestamp: new Date().toISOString()
});

async function testConnection(pool: pkg.Pool): Promise<boolean> {
  try {
    console.log('Testing database connection...', {
      username,
      host,
      database,
      timestamp: new Date().toISOString()
    });

    const result = await pool.query('SELECT current_user, current_database()');
    console.log('Connection test successful:', {
      current_user: result.rows[0].current_user,
      database: result.rows[0].current_database,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    const pgError = error as PostgresError;
    console.error('Connection test failed:', {
      error: pgError.message,
      code: pgError.code,
      detail: pgError.detail,
      stack: pgError.stack,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

let pool: pkg.Pool | null = null;

async function getPool(): Promise<pkg.Pool> {
  if (!pool) {
    console.log('Creating new connection pool...');

    const config = {
      host,
      port,
      database,
      user: username,
      password,
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
      },
      max: 20,
      min: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 30000, // Increased timeout
      statement_timeout: 30000,
      query_timeout: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      application_name: 'stacktracker_app',
      // Add retry logic
      retry_strategy: {
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 60000
      }
    };

    console.log('Attempting RDS connection with config:', {
      host,
      port,
      database,
      user: username,
      ssl: true,
      timestamp: new Date().toISOString()
    });

    pool = new Pool(config);

    // Test the connection immediately
    const isConnected = await testConnection(pool);
    if (!isConnected) {
      throw new Error('Failed to establish initial database connection');
    }

    pool.on('error', (err: PostgresError) => {
      console.error('Pool error:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });

      // Recreate pool on critical errors
      if (pool && (
          err.code === 'PROTOCOL_CONNECTION_LOST' ||
          err.code === 'ECONNREFUSED' ||
          err.code?.startsWith('57P') || // PostgreSQL shutdown codes
          err.code?.startsWith('08')     // Connection exception class
      )) {
        pool.end().catch(console.error);
        pool = null;
      }
    });
  }
  return pool;
}

// Export database instance for RDS only
console.log('Initializing RDS connection...');
export const rdsDb = await getPool().then(pool => {
  console.log('RDS connection initialized successfully');
  return drizzle(pool, { schema: rdsSchema }); // Explicitly use RDS schema
});