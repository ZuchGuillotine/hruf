import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Signer } from '@aws-sdk/rds-signer';

// Type definitions for better error handling
interface PostgresError extends Error {
  code?: string;
  detail?: string;
  message: string;
}

// Environment validation with detailed error messages
const required = [
  'AWS_RDS_HOST',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_RDS_USERNAME'
] as const;

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Configuration with logging
const region = process.env.AWS_REGION!.trim().replace(/['"]/g, '');
const host = process.env.AWS_RDS_HOST!.trim().replace(/['"]/g, '');
const username = process.env.AWS_RDS_USERNAME!.trim();
const port = 5432;
const database = 'stacktracker1';

console.log('Initializing RDS connection with:', {
  host,
  port,
  region,
  username,
  database,
  timestamp: new Date().toISOString()
});

async function getAuthToken(retryCount = 3): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Attempting to get IAM auth token (attempt ${attempt}/${retryCount})...`, {
        host,
        port,
        region,
        username,
        database,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        timestamp: new Date().toISOString()
      });

      const credentials = await defaultProvider()();
      console.log('Successfully loaded AWS credentials');

      const signer = new Signer({
        region,
        hostname: host,
        port,
        username: username.toLowerCase(),
        credentials
      });

      const token = await signer.getAuthToken();

      if (!token) {
        throw new Error('Failed to generate auth token - token is empty');
      }

      console.log('Successfully obtained IAM auth token:', {
        tokenLength: token.length,
        timestamp: new Date().toISOString(),
        username: username.toLowerCase()
      });

      return token;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to get IAM auth token (attempt ${attempt}/${retryCount}):`, {
        error: lastError.message,
        stack: lastError.stack,
        timestamp: new Date().toISOString(),
        username: username.toLowerCase()
      });

      if (attempt < retryCount) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
}

async function testConnection(pool: pkg.Pool): Promise<boolean> {
  try {
    console.log('Testing database connection...', {
      username: username.toLowerCase(),
      host,
      database,
      timestamp: new Date().toISOString()
    });

    const result = await pool.query('SELECT current_user, current_database(), session_user');
    console.log('Connection test successful:', {
      current_user: result.rows[0].current_user,
      session_user: result.rows[0].session_user,
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
      timestamp: new Date().toISOString(),
      username: username.toLowerCase()
    });
    return false;
  }
}

const createPoolConfig = async () => {
  console.log('Creating pool configuration...', {
    host,
    port,
    database,
    username: username.toLowerCase(),
    timestamp: new Date().toISOString()
  });

  // Get auth token with retries
  const token = await getAuthToken();

  const config = {
    host,
    port,
    database,
    user: username.toLowerCase(),
    password: token,
    ssl: {
      rejectUnauthorized: false, // Allow self-signed certificates for development
      // In production, you should use the proper CA certificate
    },
    // Connection pool settings
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

  console.log('Pool configuration created:', {
    ...config,
    password: '[REDACTED]',
    timestamp: new Date().toISOString()
  });

  return config;
};

let pool: pkg.Pool | null = null;
let isRefreshing = false;

async function getPool(): Promise<pkg.Pool> {
  if (!pool) {
    console.log('Creating new connection pool...');
    const config = await createPoolConfig();
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
        timestamp: new Date().toISOString(),
        connectionDetails: {
          host,
          port,
          database,
          region,
          username: username.toLowerCase()
        }
      });

      if (err.code === 'PROTOCOL_CONNECTION_LOST' ||
          err.code === 'ECONNREFUSED' ||
          err.code === '57P01' || // admin shutdown
          err.code === '57P02' || // crash shutdown
          err.code === '57P03' || // cannot connect now
          err.code === '08006' || // connection failure
          err.code === '08001' || // unable to connect
          err.code === '08004' ||  // rejected connection
          err.code === '28P01'     // password authentication failed
      ) {
        console.log('Critical error detected, resetting pool');
        if (pool) {
          await pool.end().catch(console.error);
        }
        pool = null;
      }
    });

    // Set up token refresh
    const refreshToken = async () => {
      if (isRefreshing) return;
      try {
        isRefreshing = true;
        console.log('Refreshing IAM auth token...');
        if (pool) {
          const oldPool = pool;
          const config = await createPoolConfig();
          pool = new Pool(config);

          // Test new pool before switching
          const isConnected = await testConnection(pool);
          if (isConnected) {
            console.log('New pool connection verified');
            await oldPool.end();
          } else {
            console.error('New pool verification failed, keeping old pool');
            pool = oldPool;
          }
        }
        console.log('Successfully refreshed IAM auth token and pool');
      } catch (err) {
        console.error('Failed to refresh IAM auth token:', err);
      } finally {
        isRefreshing = false;
      }
    };

    // Refresh token every 10 minutes
    setInterval(refreshToken, 10 * 60 * 1000);
  }
  return pool;
}

// Export database instance with initialization logging
console.log('Initializing database connection...');
export const rdsDb = await getPool().then(pool => {
  console.log('Database connection initialized successfully');
  return drizzle(pool);
});