import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { supplementReference } from "./schema";

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

// Remove database name from URL for initial connection
const getRootUrl = (url: string) => {
  const match = url.match(/(postgres:\/\/[^:]+:[^@]+@[^:]+:\d+)\/.*/);
  return match ? match[1] + '/postgres' : url; // Connect to 'postgres' database initially
};

const rdsUrl = ensureCorrectProtocol(process.env.AWS_RDS_URL);
const rootUrl = getRootUrl(rdsUrl);

console.log('Attempting to connect to RDS with URL pattern:', 
  rdsUrl.replace(/:[^:@]+@/, ':****@'));
console.log('Network Configuration:', {
  sourceRegion: 'us-east-1',
  targetRegion: 'us-east-2',
  internetGateway: 'igw-0f7c57458c5d92051',
  sourceIP: '34.148.196.141',
  targetIP: '18.190.138.254',
  port: 5432,
  connectionTimeout: poolConfig.connectionTimeoutMillis
});

// Enhanced pool configuration with aggressive timeouts and retry strategy
const poolConfig = {
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'no-verify',
    ssl: true,
    sslConnectTimeout: 10000
  },
  connectionTimeoutMillis: 300000, // 5 minutes
  idleTimeoutMillis: 300000,
  max: 1, // Single connection to avoid overhead
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  statement_timeout: 120000, // 2 minutes
  query_timeout: 120000,
  application_name: 'supplement-tracker',
  retry_strategy: {
    retries: 5,
    factor: 1.5,
    minTimeout: 2000,
    maxTimeout: 120000
  },
  // Network-level timeouts
  tcp_keepalive: true,
  tcp_keepalive_time: 60,
  tcp_keepalive_interval: 30,
  tcp_keepalive_count: 5
};

// Construct a connection string with explicit parameters
const getConnectionString = (url: string) => {
  const parsed = new URL(url);
  return `postgres://${parsed.username}:${parsed.password}@${parsed.hostname}:${parsed.port}${parsed.pathname}?sslmode=no-verify&ssl=true&connect_timeout=300&application_name=supplement-tracker&keepalives=1&keepalives_idle=60&keepalives_interval=30&keepalives_count=5`;
};

// First create a pool for root connection (no database specified)
const rootPool = new Pool({
  connectionString: getConnectionString(rootUrl),
  ...poolConfig
});

// Create the database if it doesn't exist
export const createDatabaseIfNotExists = async () => {
  const client = await rootPool.connect();
  try {
    // Extract database name from full URL
    const dbName = rdsUrl.split('/').pop()?.split('?')[0];
    if (!dbName) throw new Error('Could not extract database name from URL');

    console.log('Checking if database exists:', dbName);

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database ${dbName}...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (error) {
    console.error('Error in createDatabaseIfNotExists:', {
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  } finally {
    client.release();
  }
};

// Pool for actual application connection (with database)
const pool = new Pool({
  connectionString: getConnectionString(rdsUrl),
  ...poolConfig
});

// Enhanced connection event logging
pool.on('connect', (client) => {
  console.log('New client connected to PostgreSQL:', {
    timestamp: new Date().toISOString(),
    database: pool.options.database,
    host: pool.options.host,
    port: pool.options.port,
    user: pool.options.user,
    application_name: pool.options.application_name
  });
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', {
    message: err instanceof Error ? err.message : String(err),
    code: err instanceof Error && 'code' in err ? (err as any).code : undefined,
    stack: err instanceof Error ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

pool.on('acquire', () => {
  console.log('Client acquired from pool');
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});

export const rdsDb = drizzle(pool);