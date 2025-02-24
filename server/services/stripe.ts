
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
      success_url: `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/payment/cancel`,
      subscription_data: {
        trial_period_days: 14,
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
      })
      .where(eq(users.id, userId));
  },

  async extendTrialPeriod(subscriptionId: string, daysToAdd: number) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const newTrialEnd = Math.floor(Date.now() / 1000) + (daysToAdd * 86400);
    
    return stripe.subscriptions.update(subscriptionId, {
      trial_end: newTrialEnd,
    });
  },

  async setUserAsPro(userId: number) {
    return db.update(users)
      .set({ isPro: true })
      .where(eq(users.id, userId));
  }
};
