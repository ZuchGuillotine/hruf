import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import * as neonSchema from './neon-schema';
import * as rdsSchema from './rds-schema';
import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const proxyEndpoint = 'stackproxy.proxy-c9y68m0iab7h.us-east-2.rds.amazonaws.com';
const rdsUrl = `postgres://${process.env.RDS_USERNAME}:${process.env.RDS_PASSWORD}@${proxyEndpoint}:5432/stacktracker1`;
if (!process.env.RDS_USERNAME || !process.env.RDS_PASSWORD) {
  throw new Error("RDS_USERNAME and RDS_PASSWORD must be set");
}

// NeonDB connection
const neonConfig = neon(process.env.DATABASE_URL);
export const neonDb = drizzle(neonConfig, { schema: neonSchema });
export const db = neonDb; // Alias for backward compatibility

// RDS connection using appropriate drizzle connector
const rdsPool = new Pool({ connectionString: rdsUrl });
export const rdsDb = drizzlePostgres(rdsPool, { schema: rdsSchema });

// Re-export specific schemas to maintain clear database boundaries
export { users, healthStats, supplements, blogPosts } from './neon-schema';
export { supplementLogs, qualitativeLogs, supplementReference } from './rds-schema';