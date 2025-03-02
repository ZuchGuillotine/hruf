
import { sql } from "drizzle-orm";
import { db } from "../index";

async function main() {
  console.log("Running migration: create research_documents table");
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS research_documents (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      image_urls JSONB DEFAULT '[]'::jsonb,
      published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      authors TEXT NOT NULL,
      tags JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_research_documents_slug ON research_documents(slug);
    CREATE INDEX IF NOT EXISTS idx_research_documents_published_at ON research_documents(published_at);
  `);
  
  console.log("✅ Migration completed successfully");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
