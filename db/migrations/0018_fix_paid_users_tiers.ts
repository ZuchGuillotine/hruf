
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import Stripe from 'stripe';

async function main() {
  console.log('Starting migration execution...');
  
  try {
    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL environment variable');
      process.exit(1);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      process.exit(1);
    }

    console.log('Creating Stripe instance...');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe instance created');

    console.log('Initializing database connection...');
    const sql_connection = neon(process.env.DATABASE_URL);
    const db = drizzle(sql_connection);
    console.log('Database connection initialized');

    console.log('Executing user query...');
    const results = await db.execute(sql`
      SELECT id, email, stripe_customer_id, subscription_tier
      FROM users 
      WHERE stripe_customer_id IS NOT NULL
    `);
    console.log(`Query complete. Found ${results.rows.length} users`);

    for (const user of results.rows) {
      console.log(`\nProcessing user ID: ${user.id}, Email: ${user.email}`);
      console.log(`Current tier: ${user.subscription_tier}`);
      console.log(`Stripe customer ID: ${user.stripe_customer_id}`);
      
      try {
        console.log('Fetching Stripe subscriptions...');
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          limit: 1
        });
        console.log(`Found ${subscriptions.data.length} active subscriptions`);

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const productId = subscription.items.data[0].price.product;
          console.log(`Product ID from Stripe: ${productId}`);

          console.log('Updating user tier in database...');
          await db.execute(sql`
            UPDATE users 
            SET subscription_tier = (
              CASE 
                WHEN ${productId} = 'prod_SF40NCVtZWsX05' THEN 'starter'
                WHEN ${productId} = 'prod_RtcuCvjOY9gHvm' THEN 'pro'
                ELSE subscription_tier
              END
            )
            WHERE id = ${user.id}
          `);
          console.log('Database update complete');
        }
      } catch (err) {
        console.error(`Error processing user ${user.email}:`);
        console.error(err);
        console.trace('Error stack trace:');
      }
    }

    console.log('\nMigration completed successfully');
  } catch (error) {
    console.error('Migration failed with error:');
    console.error(error);
    console.trace('Error stack trace:');
    process.exit(1);
  }
}

if (process.argv[1] === import.meta.url) {
  console.log('Migration script starting...');
  main().catch((error) => {
    console.error('Unhandled error in main:');
    console.error(error);
    process.exit(1);
  });
}
