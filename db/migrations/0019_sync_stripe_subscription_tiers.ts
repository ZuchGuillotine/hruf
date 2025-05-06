
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

// Map product IDs to subscription tiers
const PRODUCT_TIERS: Record<string, 'free' | 'starter' | 'pro'> = {
  'prod_SF40NCVtZWsX05': 'starter', // Starter AI essentials
  'prod_RtcuCvjOY9gHvm': 'pro'      // Pro biohacker suite
};

export async function up() {
  console.log('Starting subscription tier sync migration...');
  
  try {
    // Test database connection first
    await db.execute(sql`SELECT 1`);
    console.log('Database connection verified');

    // Get users with Stripe customer IDs
    const users = await db.execute(sql`
      SELECT id, email, stripe_customer_id, subscription_tier 
      FROM users 
      WHERE stripe_customer_id IS NOT NULL
    `);

    console.log(`Found ${users.rows.length} users with Stripe customer IDs`);

    for (const user of users.rows) {
      try {
        console.log(`Processing user ${user.email}`);
        
        // Get active subscriptions for customer
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          expand: ['data.items.data.price.product']
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const productId = subscription.items.data[0].price.product.id;
          const newTier = PRODUCT_TIERS[productId] || 'free';

          if (newTier !== user.subscription_tier) {
            await db.execute(sql`
              UPDATE users 
              SET subscription_tier = ${newTier},
                  updated_at = NOW()
              WHERE id = ${user.id}
            `);
            console.log(`Updated ${user.email} from ${user.subscription_tier} to ${newTier}`);
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

// Auto-execute if run directly
if (import.meta.url === process.argv[1]) {
  console.log('Executing migration directly...');
  up().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
} else {
  console.log('Migration module loaded but not executed directly');
}
