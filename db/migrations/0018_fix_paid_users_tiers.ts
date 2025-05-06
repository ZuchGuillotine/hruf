import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import Stripe from 'stripe';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL environment variable');
    process.exit(1);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    process.exit(1);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('Starting migration to fix paid users subscription tiers...');

  try {
    const sql_connection = neon(process.env.DATABASE_URL);
    const db = drizzle(sql_connection);

    const results = await db.execute(sql`
      SELECT id, email, stripe_customer_id, subscription_tier
      FROM users 
      WHERE stripe_customer_id IS NOT NULL
    `);

    console.log(`Found ${results.rows.length} users to process`);

    for (const user of results.rows) {
      try {
        console.log(`Processing user ${user.email}`);
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active'
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const productId = subscription.items.data[0].price.product;

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

          console.log(`Updated tier for ${user.email}`);
        }
      } catch (err) {
        console.error(`Error processing user ${user.email}:`, err);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (process.argv[1] === import.meta.url) {
  main().catch(console.error);
}