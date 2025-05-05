import Stripe from 'stripe';
import { users } from '../../db/schema';
import { db } from '../../db';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID;

export const stripeService = {
  async createCheckoutSession(userId: number, priceId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) throw new Error('User not found');

    return stripe.checkout.sessions.create({
      customer_email: user[0].email,
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.APP_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'}/subscription`,
      subscription_data: {
        metadata: {
          userId: userId.toString(),
        },
      },
    });
  },

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Get userId from metadata or client_reference_id
    let userId = 0;
    
    if (subscription.metadata && subscription.metadata.userId) {
      userId = parseInt(subscription.metadata.userId, 10);
    }
    
    // client_reference_id is deprecated, but keeping this for backward compatibility
    if (!userId && (subscription as any).client_reference_id) {
      userId = parseInt((subscription as any).client_reference_id, 10);
    }
    
    if (!userId) {
      console.error('Cannot update subscription: No user ID found in metadata or client_reference_id', {
        subscriptionId: subscription.id,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Map price IDs to tiers - use both env vars and hardcoded IDs as fallback
    const priceToTier: Record<string, string> = {
      // Try env vars first
      [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: 'pro',
      [process.env.STRIPE_PRO_YEARLY_PRICE_ID || '']: 'pro',
      [process.env.STRIPE_CORE_MONTHLY_PRICE_ID || '']: 'starter',
      [process.env.STRIPE_CORE_YEARLY_PRICE_ID || '']: 'starter',
      // Fallback to hardcoded IDs (replace with your actual IDs)
      'price_1QvyNlAIJBVVerrJPOw4EIMa': 'pro', // Pro monthly
      'price_1QvyNlAIJBVVerrJPOw5FIMa': 'pro', // Pro yearly
      'price_1QzpeMAIJBVVerrJ12ZYExkV': 'starter', // Starter monthly
      'price_1QzpeMAIJBVVerrJ12ZYFxkV': 'starter', // Starter yearly
    };

    const currentPriceId = subscription.items.data[0].price.id;
    
    // Determine tier based on price/product and subscription status
    // 'active' includes paid subscriptions and those in trial
    // 'trialing' is handled as active too
    const isActive = ['active', 'trialing'].includes(subscription.status);
    const subscriptionTier = isActive 
      ? (priceToTier[currentPriceId] || 'free')
      : 'free';

    console.log('Updating user subscription:', {
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: currentPriceId,
      tier: subscriptionTier,
      timestamp: new Date().toISOString()
    });
                   
    await db.update(users)
      .set({ 
        subscriptionId: subscription.id,
        subscriptionTier: subscriptionTier
      })
      .where(eq(users.id, userId));
  },

  // Check if a user has an active paid subscription
  async hasActivePaidSubscription(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return false;

    // Only 'starter' and 'pro' tiers are considered paid
    return ['starter', 'pro'].includes(user.subscriptionTier);
  },

  // Method to check subscription tier
  async getSubscriptionTier(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return 'free';
    return user.subscriptionTier;
  },

  async setUserAsPro(userId: number) {
    return db.update(users)
      .set({ subscriptionTier: 'pro' })
      .where(eq(users.id, userId));
  }
};