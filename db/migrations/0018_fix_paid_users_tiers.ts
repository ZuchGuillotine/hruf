
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import Stripe from 'stripe';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const sql_connection = neon(process.env.DATABASE_URL);
const db = drizzle(sql_connection);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function up() {
  console.log('Starting migration to fix paid users subscription tiers...');

  try {
    // Get all users with Stripe customer IDs but marked as free
    const results = await db.execute(sql`
      SELECT id, email, stripe_customer_id 
      FROM users 
      WHERE subscription_tier = 'free' 
      AND stripe_customer_id IS NOT NULL
    `);

    for (const user of results.rows) {
      try {
        // Get customer's subscriptions from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          expand: ['data.items.data.price.product']
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const productId = subscription.items.data[0].price.product as string;
          
          // Update user's subscription tier based on product
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
        }
      } catch (err) {
        console.error(`Error processing user ${user.email}:`, err);
      }
    }

    console.log('✅ Successfully updated paid users subscription tiers');
    return Promise.resolve();
  } catch (error) {
    console.error('Migration failed:', error);
    return Promise.reject(error);
  }
}

export async function down() {
  // No down migration needed as this is a data fix
  return Promise.resolve();
}
