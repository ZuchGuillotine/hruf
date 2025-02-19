
import { sql } from 'drizzle-orm';

export async function up(db: any) {
  // First handle the health_stats change
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE numeric;
  `);
  
  // Then handle blog slugs safely
  await db.execute(sql`
    DO $$
    BEGIN
      -- Create temporary unique slugs if duplicates exist
      UPDATE blog_posts 
      SET slug = slug || '-' || id 
      WHERE slug IN (
        SELECT slug 
        FROM blog_posts 
        GROUP BY slug 
        HAVING COUNT(*) > 1
      );
      
      -- Now safe to add the constraint
      ALTER TABLE blog_posts 
      ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);
    END $$;
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE health_stats 
    ALTER COLUMN average_sleep TYPE integer;
  `);
  
  await db.execute(sql`
    ALTER TABLE blog_posts 
    DROP CONSTRAINT IF EXISTS blog_posts_slug_unique;
  `);
}
