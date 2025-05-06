
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import Stripe from 'stripe';

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function main() {
  console.log('Starting migration to fix paid users subscription tiers...');
  console.log('Environment check:');
  console.log('- Database URL exists:', !!process.env.DATABASE_URL);
  console.log('- Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);

  try {
    console.log('Initializing database connection...');
    const sql_connection = neon(process.env.DATABASE_URL);
    const db = drizzle(sql_connection);
    console.log('Database connection initialized');

    console.log('Querying users with stripe_customer_id...');
    const results = await db.execute(sql`
      SELECT id, email, stripe_customer_id, subscription_tier
      FROM users 
      WHERE stripe_customer_id IS NOT NULL
    `);

    console.log(`Found ${results.rows.length} users with Stripe customer IDs`);

    for (const user of results.rows) {
      console.log(`\nProcessing user ${user.email} (current tier: ${user.subscription_tier})`);
      
      try {
        console.log(`Fetching subscriptions for customer ${user.stripe_customer_id}`);
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active'
        });

        console.log(`Found ${subscriptions.data.length} active subscriptions`);

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const productId = subscription.items.data[0].price.product as string;
          console.log(`Found product ID: ${productId}`);

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

          console.log(`Updated subscription tier for user ${user.email}`);
        } else {
          console.log(`No active subscriptions found for user ${user.email}`);
        }
      } catch (err) {
        console.error(`Error processing user ${user.email}:`, err);
      }
    }

    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Make sure this runs when executed directly
if (import.meta.url === process.argv[1]) {
  console.log('Starting migration script...');
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
