import Stripe from 'stripe';
declare class StripeService {
  stripe: Stripe;
  constructor();
  /**
   * Create a checkout session
   * @param {object} options - Options for creating a checkout session
   * @returns {Promise<Stripe.Checkout.Session>} - The created checkout session
   */
  createCheckoutSession(options: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session>;
  /**
   * Get a checkout session by ID
   * @param {string} sessionId - The checkout session ID
   * @returns {Promise<Stripe.Checkout.Session>} - The checkout session
   */
  getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>;
  /**
   * Update a user's stripe customer ID
   * @param {number} userId - The user ID
   * @param {string} customerId - The Stripe customer ID
   * @returns {Promise<any>} - The updated user
   */
  updateStripeCustomerId(
    userId: number,
    customerId: string
  ): Promise<{
    subscriptionId: string | null;
    subscriptionTier: string;
    stripeCustomerId: string | null;
    aiInteractionsCount: number | null;
    aiInteractionsReset: Date | null;
    labUploadsCount: number | null;
    labUploadsReset: Date | null;
    lastRewardedAt: Date | null;
    id: number;
    username: string;
    password: string;
    email: string;
    name: string | null;
    phoneNumber: string | null;
    isAdmin: boolean | null;
    emailVerified: boolean | null;
    verificationToken: string | null;
    verificationTokenExpiry: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  /**
   * Update a user's subscription details
   * @param {number} userId - The user ID
   * @param {object} data - The stripe data
   * @returns {Promise<any>} - The updated user
   */
  updateUserStripeInfo(
    userId: number,
    data: {
      customerId: string;
      subscriptionId: string;
    }
  ): Promise<{
    subscriptionId: string | null;
    subscriptionTier: string;
    stripeCustomerId: string | null;
    aiInteractionsCount: number | null;
    aiInteractionsReset: Date | null;
    labUploadsCount: number | null;
    labUploadsReset: Date | null;
    lastRewardedAt: Date | null;
    id: number;
    username: string;
    password: string;
    email: string;
    name: string | null;
    phoneNumber: string | null;
    isAdmin: boolean | null;
    emailVerified: boolean | null;
    verificationToken: string | null;
    verificationTokenExpiry: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  /**
   * Determine subscription tier from Stripe product ID
   * @param {string} productId - The Stripe product ID
   * @returns {string} - The subscription tier
   */
  getTierFromProductId(productId: string): 'free' | 'starter' | 'pro';
  /**
   * Update a user's trial status
   * @param {number} userId - The user ID
   * @returns {Promise<any>} - The updated user
   */
  updateTrialStatus(userId: number): Promise<{
    id: number;
    subscriptionId: string | null;
    subscriptionTier: string;
  }>;
}
export declare const getTierFromProductId: (productId: string) => 'free' | 'starter' | 'pro';
declare const stripeService: StripeService;
export default stripeService;
//# sourceMappingURL=stripe.d.ts.map
