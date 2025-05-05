import Stripe from 'stripe';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { getTierFromProductId } from '../../client/src/lib/stripe-price-ids';

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

/**
 * Creates a Stripe checkout session
 * 
 * @param priceId Stripe price ID
 * @param successUrl URL to redirect after successful payment
 * @param cancelUrl URL to redirect if payment is canceled
 * @param customerId Optional Stripe customer ID for existing customers
 * @param metadata Additional metadata to include in the session
 * @returns Checkout session details including the URL
 */
export async function createCheckoutSession(
  priceId: string,
  successUrl: string = `${process.env.SERVER_URL || 'http://localhost:5000'}/payment-success`,
  cancelUrl: string = `${process.env.SERVER_URL || 'http://localhost:5000'}/subscription`,
  customerId?: string | null,
  metadata?: Record<string, string>
) {
  try {
    // Create checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: metadata || {},
    };

    // Add customer ID if provided
    if (customerId) {
      sessionParams.customer = customerId;
    }

    // Create the session
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieves a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw error;
  }
}

/**
 * Updates user subscription information in the database
 */
export async function updateUserSubscription(
  userId: number,
  subscriptionId: string,
  customerId: string,
  productId: string
) {
  try {
    // Determine subscription tier from product ID
    const subscriptionTier = getTierFromProductId(productId);
    
    // Update user record with subscription information
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionTier,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

/**
 * Cancels a user's subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export default {
  createCheckoutSession,
  getCheckoutSession,
  updateUserSubscription,
  cancelSubscription,
  stripe,
};