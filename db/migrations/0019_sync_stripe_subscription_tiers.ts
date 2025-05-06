
import { db } from '../index';
import { sql } from 'drizzle-orm';
import Stripe from 'stripe';

console.log('Migration script starting...');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Map price IDs to subscription tiers
const PRICE_TIERS: Record<string, 'free' | 'starter' | 'pro'> = {
  'price_1RKZsdAIJBVVerrJhsQhpig2': 'starter', // Starter Monthly
  'price_1RKZsdAIJBVVerrJmp9neLDz': 'starter', // Starter Yearly
  'price_1RFrkBAIJBVVerrJNDRc9xSL': 'pro',     // Pro Monthly
  'price_1RKZwJAIJBVVerrJjGTuhgbG': 'pro'      // Pro Yearly
};

export async function up() {
  console.log('Starting subscription tier sync migration...');
  
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);
    console.log('Database connection verified');

    // Get all users that have either a stripe_customer_id or subscription_id
    const users = await db.execute(sql`
      SELECT id, email, stripe_customer_id, subscription_id, subscription_tier 
      FROM users 
      WHERE stripe_customer_id IS NOT NULL 
      OR subscription_id IS NOT NULL
    `);

    console.log(`Found ${users.rows.length} users with Stripe info`);

    for (const user of users.rows) {
      try {
        console.log(`Processing user ${user.email}`);
        
        // If user has subscription_id, use that first
        if (user.subscription_id) {
          const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
          const priceId = subscription.items.data[0].price.id;
          const newTier = PRICE_TIERS[priceId] || 'free';

          if (newTier !== user.subscription_tier) {
            await db.execute(sql`
              UPDATE users 
              SET subscription_tier = ${newTier},
                  updated_at = NOW()
              WHERE id = ${user.id}
            `);
            console.log(`Updated ${user.email} from ${user.subscription_tier} to ${newTier} using subscription`);
          }
        }
        // Otherwise check for active subscriptions using customer ID
        else if (user.stripe_customer_id) {
          const subscriptions = await stripe.subscriptions.list({
            customer: user.stripe_customer_id,
            status: 'active',
            limit: 1
          });

          if (subscriptions.data.length > 0) {
            const priceId = subscriptions.data[0].items.data[0].price.id;
            const newTier = PRICE_TIERS[priceId] || 'free';

            if (newTier !== user.subscription_tier) {
              await db.execute(sql`
                UPDATE users 
                SET subscription_tier = ${newTier},
                    subscription_id = ${subscriptions.data[0].id},
                    updated_at = NOW()
                WHERE id = ${user.id}
              `);
              console.log(`Updated ${user.email} from ${user.subscription_tier} to ${newTier} using customer ID`);
            }
          } else {
            // No active subscriptions - set to free tier
            if (user.subscription_tier !== 'free') {
              await db.execute(sql`
                UPDATE users 
                SET subscription_tier = 'free',
                    updated_at = NOW()
                WHERE id = ${user.id}
              `);
              console.log(`Reset ${user.email} to free tier (no active subscriptions)`);
            }
          }
        }
      } catch (err) {
        console.error(`Error processing user ${user.email}:`, err);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down() {
  console.log('No down migration implemented');
}

// Auto-execute if this file is the entry point
const isDirectExecution = async () => {
  try {
    await up();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

isDirectExecution();
