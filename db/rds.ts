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
  message: string;
}

// Environment validation with detailed error messages
const required = ['AWS_RDS_PROXY_ENDPOINT', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] as const;
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Configuration with logging
const region = process.env.AWS_REGION!.replace(/['"]/g, '');
const proxyEndpoint = process.env.AWS_RDS_PROXY_ENDPOINT!;

// Parse proxy endpoint
const matches = proxyEndpoint.match(/^([^:]+):(\d+)$/);
if (!matches) {
  throw new Error('Invalid AWS_RDS_PROXY_ENDPOINT format. Expected format: hostname:port');
}

const [_, host, portStr] = matches;
const port = parseInt(portStr);

console.log('Initializing RDS proxy connection with:', {
  host,
  port,
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
        username: 'Bencox820',
      });

      const token = await signer.getAuthToken();
      console.log(`Successfully obtained IAM auth token on attempt ${attempt}`);
      return token;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to get IAM auth token (attempt ${attempt}/${maxRetries}):`, {
        error: lastError.message,
        timestamp: new Date().toISOString()
      });
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  throw lastError!;
}

// Enhanced pool configuration for RDS Proxy with IP logging
const createPoolConfig = async () => {
  console.log('Creating pool configuration with the following network details:', {
    host,
    port,
    database: 'stacktracker1',
    region,
    timestamp: new Date().toISOString(),
  });

  return {
    host,
    port,
    database: 'stacktracker1',
    user: 'Bencox820',
    password: await getAuthToken(),
    ssl: {
      rejectUnauthorized: true,
      sslmode: 'verify-full', // Added back for security
      checkServerIdentity: (host: string, cert: any) => {
        // Accept RDS proxy wildcard certificates
        const validHosts = [
          `.rds.amazonaws.com`,
          `.proxy-${region}.rds.amazonaws.com`
        ];
        if (validHosts.some(validHost => host.endsWith(validHost))) {
          return undefined;
        }
        return new Error(`Certificate not valid for ${host}`);
      }
    },
    // Connection pool settings
    max: 5,
    min: 0,
    idleTimeoutMillis: 120000,
    connectionTimeoutMillis: 60000,
    statement_timeout: 60000,
    query_timeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    application_name: 'stacktracker_app',
  };
};

// Create and manage pool with enhanced error and connection logging
let pool: pkg.Pool | null = null;

async function getPool(): Promise<pkg.Pool> {
  if (!pool) {
    console.log('Creating new connection pool...');
    const config = await createPoolConfig();
    pool = new Pool(config);

    // Enhanced error handling with detailed connection info
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

      if (err.code === 'ECONNREFUSED') {
        console.error('Connection refused. This might indicate a network or security group issue.');
      }

      // Reset pool on critical errors
      if (err.code === 'PROTOCOL_CONNECTION_LOST' ||
          err.code === 'ECONNREFUSED' ||
          err.code === '57P01' ||
          err.code === '57P02' ||
          err.code === '57P03' ||
          err.code === '08006' ||
          err.code === '08001' ||
          err.code === '08004') {
        console.log('Critical error detected, resetting pool');
        pool = null;
      }
    });

    // Connection lifecycle logging with network details
    pool.on('connect', (client) => {
      const socket = (client as any).connection.stream;
      console.log('New client connected to pool:', {
        timestamp: new Date().toISOString(),
        localAddress: socket.localAddress,
        localPort: socket.localPort,
        remoteAddress: socket.remoteAddress,
        remotePort: socket.remotePort,
        host,
        port,
        database: 'stacktracker1'
      });
    });

    pool.on('acquire', () => {
      console.log('Client acquired from pool');
    });

    pool.on('remove', () => {
      console.log('Client removed from pool');
    });

    // Token refresh every 14 minutes
    setInterval(async () => {
      try {
        console.log('Refreshing IAM auth token...');
        const newToken = await getAuthToken();
        if (pool) {
          await pool.end();
        }
        const config = await createPoolConfig();
        pool = new Pool(config);
        console.log('Successfully refreshed IAM auth token and pool');
      } catch (err) {
        console.error('Failed to refresh IAM auth token:', err);
      }
    }, 14 * 60 * 1000);
  }
  return pool;
}

// Export database instance with initialization logging
console.log('Initializing database connection...');
export const rdsDb = await getPool().then(pool => {
  console.log('Database connection initialized successfully');
  return drizzle(pool);
});