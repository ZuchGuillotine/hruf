
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// NeonDB connection
const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// RDS connection
const rdsPool = new Pool({
  connectionString: process.env.RDS_URL,
});

export const db = drizzle(neonPool);
export const rdsDb = drizzle(rdsPool);

// Re-export schemas
export * from './neon-schema';
export * from './rds-schema';
