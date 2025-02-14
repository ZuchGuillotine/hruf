import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";

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

const host = process.env.AWS_RDS_HOST!.trim();
const username = process.env.RDS_USERNAME!.trim();
const password = process.env.RDS_PASSWORD!.trim();
const port = 5432;
const database = 'stacktracker1';

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
        rejectUnauthorized: false
      },
      max: 20,
      min: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      application_name: 'stacktracker_app',
    };

    pool = new Pool(config);

    // Test the connection immediately
    const isConnected = await testConnection(pool);
    if (!isConnected) {
      throw new Error('Failed to establish initial database connection');
    }

    pool.on('error', async (err: PostgresError) => {
      console.error('Pool error:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });

      if (err.code === 'PROTOCOL_CONNECTION_LOST' ||
          err.code === 'ECONNREFUSED' ||
          err.code === '57P01' || // admin shutdown
          err.code === '57P02' || // crash shutdown
          err.code === '57P03' || // cannot connect now
          err.code === '08006' || // connection failure
          err.code === '08001' || // unable to connect
          err.code === '08004'    // rejected connection
      ) {
        if (pool) {
          await pool.end().catch(console.error);
        }
        pool = null;
      }
    });
  }
  return pool;
}

// Export database instance
console.log('Initializing database connection...');
export const rdsDb = await getPool().then(pool => {
  console.log('Database connection initialized successfully');
  return drizzle(pool);
});