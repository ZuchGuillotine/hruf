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
      success_url: `${process.env.APP_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'}/profile`,
      subscription_data: {
        trial_period_days: isTrialEligible ? 14 : undefined,
        metadata: {
          userId: userId.toString(),
        },
      },
    });
  },

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = parseInt(subscription.metadata.userId);
    await db.update(users)
      .set({ 
        isPro: subscription.status === 'active',
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      })
      .where(eq(users.id, userId));
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