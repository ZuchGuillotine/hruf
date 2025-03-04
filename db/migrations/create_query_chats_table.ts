
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient);

  console.log("Creating query_chats table if it doesn't exist...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS query_chats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      messages JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB DEFAULT '{}'::jsonb
    );
  `);

  console.log("Migration completed successfully!");
  await queryClient.end();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
