
import { sql } from 'drizzle-orm';
import { pgTable, serial, integer, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_summaries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      summary TEXT NOT NULL,
      period_start TIMESTAMP NOT NULL,
      period_end TIMESTAMP NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS chat_summaries;`);
}
