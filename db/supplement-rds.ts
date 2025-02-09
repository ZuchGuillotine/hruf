import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const supplementPool = new Pool({
  host: process.env.SUPPLEMENT_RDS_HOST,
  port: parseInt(process.env.SUPPLEMENT_RDS_PORT || '5432'),
  database: process.env.SUPPLEMENT_RDS_DATABASE,
  user: process.env.SUPPLEMENT_RDS_USER,
  password: process.env.SUPPLEMENT_RDS_PASSWORD,
  ssl: {
    rejectUnauthorized: false // For development, should be configured properly in production
  }
});

export const supplementRdsDb = drizzle(supplementPool);

// Verify connection
supplementPool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to supplement RDS:', err);
  } else {
    console.log('Successfully connected to supplement RDS database');
  }
});
