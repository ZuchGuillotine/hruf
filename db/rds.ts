import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { RDS } from '@aws-sdk/client-rds';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Signer } from '@aws-sdk/rds-signer';

// Type definitions for better error handling
interface PostgresError extends Error {
  code?: string;
  detail?: string;
}

// Environment validation with detailed error messages
const required = ['AWS_RDS_URL', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] as const;
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Configuration with logging
const region = process.env.AWS_REGION!.replace(/['"]/g, ''); // Remove any quotes
const rdsUrl = process.env.AWS_RDS_URL!;

// Parse RDS URL
const matches = rdsUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/);
if (!matches) {
  throw new Error('Invalid AWS_RDS_URL format');
}

const [_, dbUser, dbPassword, host, portStr, dbName] = matches;
const port = parseInt(portStr);

console.log('Initializing RDS connection with:', {
  host,
  port,
  database: dbName,
  user: dbUser,
  region,
  timestamp: new Date().toISOString()
});

// Get IAM auth token with retries and exponential backoff
async function getAuthToken(): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const signer = new Signer({
        region,
        hostname: host,
        port,
        username: dbUser,
      });
      const token = await signer.getAuthToken();
      console.log(`Successfully obtained auth token on attempt ${attempt}`);
      return token;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to get RDS auth token (attempt ${attempt}/${maxRetries}):`, {
        error: lastError.message,
        timestamp: new Date().toISOString()
      });
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  throw lastError!;
}

// Pool configuration for direct RDS connection
const createPoolConfig = async () => ({
  database: dbName,
  user: dbUser,
  host,
  port,
  password: await getAuthToken(),
  ssl: {
    rejectUnauthorized: true, // Required for RDS direct connection
    sslmode: 'verify-full', // Use full verification for direct connection
  },
  // Direct connection settings
  max: 20, // Increased for direct connection
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
  query_timeout: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 1000
});

// Create and manage pool with improved error handling
let pool: pkg.Pool | null = null;

async function getPool(): Promise<pkg.Pool> {
  if (!pool) {
    console.log('Creating new connection pool...');
    const config = await createPoolConfig();
    pool = new Pool(config);

    // Error handling
    pool.on('error', async (err: PostgresError) => {
      console.error('Pool error:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });

      // Reset pool on critical errors
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
          err.code === 'ECONNREFUSED' ||
          err.code === '57P01' || // Admin shutdown
          err.code === '57P02' || // Crash shutdown
          err.code === '57P03' || // Cannot connect now
          err.code === '08006' || // Connection failure
          err.code === '08001' || // Unable to establish connection
          err.code === '08004') { // Rejected connection
        console.log('Critical error detected, resetting pool');
        pool = null;
      }
    });

    // Connection handling
    pool.on('connect', () => {
      console.log('New client connected to pool');
    });

    // Token refresh every 15 minutes for direct connection
    setInterval(async () => {
      try {
        console.log('Refreshing auth token...');
        const newToken = await getAuthToken();
        if (pool) {
          await pool.end();
        }
        const config = await createPoolConfig();
        pool = new Pool(config);
        console.log('Successfully refreshed auth token and pool');
      } catch (err) {
        console.error('Failed to refresh auth token:', err);
      }
    }, 15 * 60 * 1000);
  }
  return pool;
}

// Export database instance with initialization logging
console.log('Initializing database connection...');
export const rdsDb = await getPool().then(pool => {
  console.log('Database connection initialized successfully');
  return drizzle(pool);
});