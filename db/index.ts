/**
 * @description      :
 * @author           :
 * @group            :
 * @created          : 17/05/2025 - 00:45:02
 *
 * MODIFICATION LOG
 * - Version         : 1.0.0
 * - Date            : 17/05/2025
 * - Author          :
 * - Modification    :
 **/
import dotenv from 'dotenv';
dotenv.config();
console.log('DATABASE_URL at db/index.ts:', process.env.DATABASE_URL);
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export * from './schema';
