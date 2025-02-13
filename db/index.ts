
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as neonSchema from './neon-schema';
import * as rdsSchema from './rds-schema';
import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

if (!process.env.RDS_URL) {
  throw new Error("RDS_URL must be set");
}

// NeonDB connection
const neonConfig = neon(process.env.DATABASE_URL);
export const neonDb = drizzle(neonConfig, { schema: neonSchema });
export const db = neonDb; // Alias for backward compatibility

// RDS connection
const rdsPool = new Pool({ connectionString: process.env.RDS_URL });
export const rdsDb = drizzle(rdsPool, { schema: rdsSchema });

// Re-export schemas
export * from './neon-schema';
export * from './rds-schema';
