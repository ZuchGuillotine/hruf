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

// Pool configuration for both root and application pools
const poolConfig = {
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 120000, // Increased to 2 minutes
  idleTimeoutMillis: 120000,
  max: 1,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  statement_timeout: 60000, // 1 minute statement timeout
  query_timeout: 60000,
  application_name: 'supplement-tracker', // Helps identify connections in logs
  retry_strategy: { // Add retry strategy
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 60000
  }
};

// First create a pool for root connection (no database specified)
const rootPool = new Pool({
  connectionString: rootUrl,
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
      // Create database (need to escape as it might contain dashes)
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (error) {
    console.error('Error in createDatabaseIfNotExists:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Pool for actual application connection (with database)
const pool = new Pool({
  connectionString: rdsUrl,
  ...poolConfig
});

pool.on('connect', () => {
  console.log('Established new database connection');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

pool.on('acquire', () => {
  console.log('Client acquired from pool');
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});

export const rdsDb = drizzle(pool);