
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import Stripe from 'stripe';

export async function main() {
  console.error('Migration starting...');

  try {
    if (!process.env.DATABASE_URL) {
      console.error('ERROR: Missing DATABASE_URL environment variable');
      process.exit(1);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('ERROR: Missing STRIPE_SECRET_KEY environment variable');
      process.exit(1);
    }

    console.error('Creating Stripe instance...');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.error('Stripe instance created successfully');

    console.error('Initializing database connection...');
    const sql_connection = neon(process.env.DATABASE_URL);
    const db = drizzle(sql_connection);
    console.error('Database connection initialized');

    console.error('Executing user query...');
    const results = await db.execute(sql`
      SELECT id, email, stripe_customer_id, subscription_tier
      FROM users 
      WHERE stripe_customer_id IS NOT NULL
    `);
    console.error(`Found ${results.rows.length} users to process`);

    for (const user of results.rows) {
      console.error(`\nProcessing user: ${user.email}`);
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active'
        });

        console.error(`Found ${subscriptions.data.length} active subscriptions for user`);

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const productId = subscription.items.data[0].price.product;
          console.error(`Product ID from Stripe: ${productId}`);

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
          console.error(`Updated tier for user ${user.email}`);
        } else {
          console.error(`No active subscriptions found for user ${user.email}`);
        }
      } catch (err) {
        console.error(`ERROR processing user ${user.email}:`, err);
      }
    }

    console.error('Migration completed successfully');
  } catch (error) {
    console.error('FATAL ERROR in migration:', error);
    process.exit(1);
  }
}

// Export for programmatic usage
export const up = main;
export const down = async () => {
  console.error('No down migration implemented');
};

// Auto-execute if run directly
if (import.meta.url === process.argv[1]) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
