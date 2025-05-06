
import { db } from '../index';
import { sql } from 'drizzle-orm';
import Stripe from 'stripe';
import { getTierFromProductId } from '../../server/services/stripe';

export async function main() {
  console.error('Migration starting...');
  let stripe;

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }

    // Initialize Stripe
    console.error('Creating Stripe instance...');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.error('Stripe instance created successfully');

    // Test database connection
    console.error('Testing database connection...');
    await db.execute(sql`SELECT 1`);
    console.error('Database connection verified');

    // Get all users with stripe customer IDs
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
          status: 'active',
          expand: ['data.items.data.price.product']
        });

        console.error(`Found ${subscriptions.data.length} active subscriptions for user`);

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const productId = subscription.items.data[0].price.product.id;
          console.error(`Product ID from Stripe: ${productId}`);
          
          // Debug product details
          const product = subscription.items.data[0].price.product;
          console.error('Full product details:', JSON.stringify(product, null, 2));
          
          const tier = getTierFromProductId(productId);
          console.error(`Mapped tier: ${tier}`);
          
          if (tier === 'free') {
            console.error(`WARNING: Product ${productId} mapped to free tier - this may indicate a mapping issue`);
          }

          if (tier !== user.subscription_tier) {
            await db.execute(sql`
              UPDATE users 
              SET subscription_tier = ${tier},
                  updated_at = NOW()
              WHERE id = ${user.id}
            `);
            console.error(`Updated tier for user ${user.email} from ${user.subscription_tier} to ${tier}`);
          }
        } else {
          console.error(`No active subscriptions found for user ${user.email}`);
          // Optionally reset to free tier if no active subscriptions
          if (user.subscription_tier !== 'free') {
            await db.execute(sql`
              UPDATE users 
              SET subscription_tier = 'free',
                  updated_at = NOW()
              WHERE id = ${user.id}
            `);
            console.error(`Reset user ${user.email} to free tier`);
          }
        }
      } catch (err) {
        console.error(`ERROR processing user ${user.email}:`, err);
      }
    }

    console.error('Migration completed successfully');
  } catch (error) {
    console.error('FATAL ERROR in migration:', error);
    throw error;
  }
}

export const up = main;
export const down = async () => {
  console.error('No down migration implemented');
};

// Auto-execute if run directly
if (import.meta.url === process.argv[1]) {
  console.error('Starting migration execution...');
  main().catch((error) => {
    console.error('Unhandled error:', error);
    console.error('Error details:', error.stack);
    process.exit(1);
  });
} else {
  console.error('Migration module loaded but not executed directly');
}
