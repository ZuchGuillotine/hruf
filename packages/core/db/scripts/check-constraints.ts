import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function checkConstraints() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  const client = (await import('postgres')).default(process.env.DATABASE_URL);
  const db = drizzle(client);

  try {
    // Check constraints on supplement_reference table
    const constraints = await db.execute(sql`
      SELECT con.conname, pg_get_constraintdef(con.oid)
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'supplement_reference'
      AND nsp.nspname = 'public';
    `);

    console.log('Constraints on supplement_reference table:');
    console.log(constraints);

    // Check indexes as well
    const indexes = await db.execute(sql`
      SELECT
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a,
        pg_namespace n
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = 'supplement_reference'
        AND n.nspname = 'public'
        AND n.oid = t.relnamespace
      ORDER BY
        t.relname,
        i.relname;
    `);

    console.log('\nIndexes on supplement_reference table:');
    console.log(indexes);

  } catch (error) {
    console.error('Error checking constraints:', error);
  } finally {
    await client.end();
  }
}

// Run the check
checkConstraints().catch(console.error); 