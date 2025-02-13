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
const required = ['AWS_RDS_HOST', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] as const;
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Configuration with logging
const region = process.env.AWS_REGION!.replace(/['"]/g, '');
const host = process.env.AWS_RDS_HOST!;
const port = 5432;

console.log('Initializing RDS connection with:', {
  host,
  port,
  region,
  timestamp: new Date().toISOString()
});

// Enhanced error handling with detailed error messages
async function getAuthToken(retryCount = 3): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Attempting to get IAM auth token (attempt ${attempt}/${retryCount})...`, {
        host,
        port,
        region,
        username: 'bencox820',
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      });

      const credentials = await defaultProvider()();
      console.log('Successfully loaded AWS credentials');

      const signer = new Signer({
        region,
        hostname: host,
        port,
        username: 'bencox820',
        credentials
      });

      const token = await signer.getAuthToken();
      console.log('Successfully obtained IAM auth token');
      return token;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to get IAM auth token (attempt ${attempt}/${retryCount}):`, {
        error: lastError.message,
        stack: lastError.stack,
        timestamp: new Date().toISOString()
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

// Enhanced pool configuration with detailed logging
const createPoolConfig = async () => {
  console.log('Creating pool configuration with the following network details:', {
    host,
    port,
    database: 'stacktracker1',
    region,
    timestamp: new Date().toISOString(),
  });

  const token = await getAuthToken();
  console.log('Successfully obtained auth token for pool configuration');

  return {
    host,
    port,
    database: 'stacktracker1',
    user: 'bencox820',
    password: token,
    ssl: {
      rejectUnauthorized: false, // Allow self-signed certificates
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
};

// Rest of the file remains the same but with pool management updates
let pool: pkg.Pool | null = null;
let isRefreshing = false;

async function getPool(): Promise<pkg.Pool> {
  if (!pool) {
    console.log('Creating new connection pool...');
    const config = await createPoolConfig();
    pool = new Pool(config);

    // Enhanced error handling with detailed logging
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
          database: 'stacktracker1',
          region
        }
      });

      // Reset pool on critical errors
      if (err.code === 'PROTOCOL_CONNECTION_LOST' ||
          err.code === 'ECONNREFUSED' ||
          err.code === '57P01' || // admin shutdown
          err.code === '57P02' || // crash shutdown
          err.code === '57P03' || // cannot connect now
          err.code === '08006' || // connection failure
          err.code === '08001' || // unable to connect
          err.code === '08004'    // rejected connection
      ) {
        console.log('Critical error detected, resetting pool');
        if (pool) {
          await pool.end().catch(console.error);
        }
        pool = null;
      }
    });

    // Connection lifecycle logging
    pool.on('connect', () => {
      console.log('New client connected to pool:', {
        timestamp: new Date().toISOString(),
        poolSize: (pool as any).totalCount,
        activeConnections: (pool as any).waitingCount,
        host,
        port,
        database: 'stacktracker1'
      });
    });

    // Token refresh every 10 minutes
    const refreshToken = async () => {
      if (isRefreshing) return;
      try {
        isRefreshing = true;
        console.log('Refreshing IAM auth token...');
        if (pool) {
          const oldPool = pool;
          const config = await createPoolConfig();
          pool = new Pool(config);

          // Wait for new pool to establish connection before closing old one
          try {
            await pool.query('SELECT 1');
            console.log('New pool connection verified');
            await oldPool.end();
          } catch (err) {
            console.error('New pool verification failed, keeping old pool:', err);
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