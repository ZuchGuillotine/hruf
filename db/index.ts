
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// NeonDB connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// Re-export schemas
export * from './neon-schema';
export * from './rds-schema';
