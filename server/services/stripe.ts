import Stripe from 'stripe';
import { users } from '../../db/schema';
import { db } from '../../db';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID;

export const stripeService = {
  async createCheckoutSession(userId: number, priceId: string, isTrialEligible: boolean = true) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) throw new Error('User not found');

    return stripe.checkout.sessions.create({
      customer_email: user[0].email,
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.APP_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'}/profile`,
      subscription_data: {
        trial_period_days: isTrialEligible ? 28 : undefined,
        metadata: {
          userId: userId.toString(),
        },
      },
    });
  },

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = parseInt(subscription.metadata.userId);
    
    // Map price IDs to tiers
    const priceToTier: Record<string, 'pro' | 'core'> = {
      [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: 'pro',
      [process.env.STRIPE_PRO_YEARLY_PRICE_ID || '']: 'pro',
      [process.env.STRIPE_CORE_MONTHLY_PRICE_ID || '']: 'core',
      [process.env.STRIPE_CORE_YEARLY_PRICE_ID || '']: 'core'
    };

    const currentPriceId = subscription.items.data[0].price.id;
    
    // Determine tier based on price/product and subscription status
    const subscriptionTier = subscription.status === 'active' 
      ? priceToTier[currentPriceId] || 'free'
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
        subscriptionTier,
      })
      .where(eq(users.id, userId));
  },

  // Add method to update subscription status based on trial period
  async updateTrialStatus(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return;

    // If user has active subscription through Stripe, don't modify status
    if (user.subscriptionId) return;

    const now = new Date();
    const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    
    // Determine status based on trial end date
    let status = 'trial';
    if (trialEnd && now > trialEnd) {
      status = 'expired';
    }

    await db.update(users)
      .set({ subscriptionStatus: status })
      .where(eq(users.id, userId));
  },

  // Add method to check trial status
  async checkTrialStatus(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) return false;

    // If user has active subscription, they're not in trial
    if (user.subscriptionStatus === 'pro') return false;

    // Check if trial has expired
    if (user.trialEndsAt && new Date(user.trialEndsAt) < new Date()) {
      // Update user to free status
      await db.update(users)
        .set({ 
          subscriptionStatus: 'free',
          trialEndsAt: null 
        })
        .where(eq(users.id, userId));
      return false;
    }

    return user.trialEndsAt != null;
  },

  async extendTrialPeriod(userId: number, daysToAdd: number) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].subscriptionId) throw new Error('User or subscription not found');

    const subscription = await stripe.subscriptions.retrieve(user[0].subscriptionId);
    const currentTrialEnd = subscription.trial_end || Math.floor(Date.now() / 1000);
    const newTrialEnd = currentTrialEnd + (daysToAdd * 86400);

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      trial_end: newTrialEnd,
    });

    await this.handleSubscriptionUpdated(updatedSubscription);
    return updatedSubscription;
  },

  async setUserAsPro(userId: number) {
    return db.update(users)
      .set({ isPro: true })
      .where(eq(users.id, userId));
  }
};