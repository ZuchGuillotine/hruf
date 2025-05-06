import Stripe from 'stripe';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

class StripeService {
  stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a checkout session
   * @param {object} options - Options for creating a checkout session
   * @returns {Promise<Stripe.Checkout.Session>} - The created checkout session
   */
  async createCheckoutSession(options: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    const { priceId, successUrl, cancelUrl, customerEmail, metadata } = options;

    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata,
    });
  }

  /**
   * Get a checkout session by ID
   * @param {string} sessionId - The checkout session ID
   * @returns {Promise<Stripe.Checkout.Session>} - The checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  /**
   * Update a user's stripe customer ID
   * @param {number} userId - The user ID
   * @param {string} customerId - The Stripe customer ID
   * @returns {Promise<any>} - The updated user
   */
  async updateStripeCustomerId(userId: number, customerId: string) {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  /**
   * Update a user's subscription details
   * @param {number} userId - The user ID
   * @param {object} data - The stripe data
   * @returns {Promise<any>} - The updated user
   */
  async updateUserStripeInfo(userId: number, data: { customerId: string; subscriptionId: string }) {
    const { customerId, subscriptionId } = data;
    
    // Get the product details to determine the tier
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const productId = subscription.items.data[0].price.product as string;
    const subscriptionTier = this.getTierFromProductId(productId);
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId: customerId,
        subscriptionId,
        subscriptionTier,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  /**
   * Determine subscription tier from Stripe product ID
   * @param {string} productId - The Stripe product ID
   * @returns {string} - The subscription tier
   */
  getTierFromProductId(productId: string): 'free' | 'starter' | 'pro' {
    // These should match the product IDs in your Stripe account
    const PRODUCT_MAP: Record<string, 'free' | 'starter' | 'pro'> = {
      'prod_SF40NCVtZWsX05': 'starter', // Starter AI essentials
      'prod_RtcuCvjOY9gHvm': 'pro',     // Pro biohacker suite
    };

    return PRODUCT_MAP[productId] || 'free';
  }
}

// Export the getTierFromProductId function
export const getTierFromProductId = (productId: string): 'free' | 'starter' | 'pro' => {
  return new StripeService().getTierFromProductId(productId);
};

// Export a singleton instance
const stripeService = new StripeService();
export default stripeService;