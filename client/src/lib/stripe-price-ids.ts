/**
 * Contains all Stripe product/pricing information for the application
 * This includes direct payment links, product IDs, and price information
 */

// Stripe Tier Prices and URLs
export const TIERS = {
  starter: {
    MONTHLY: {
      price: 21.99,
      url: 'https://buy.stripe.com/6oEdTTeEQaWT76028b',
    },
    YEARLY: {
      price: 184.71,
      url: 'https://buy.stripe.com/eVa177aoAfd94XSbIM',
    },
  },
  pro: {
    MONTHLY: {
      price: 49.99,
      url: 'https://buy.stripe.com/5kA5nn8gs7KH8a428e',
    },
    YEARLY: {
      price: 399.99,
      url: 'https://buy.stripe.com/8wM8zzfIU6GD760bIP',
    },
  },
};

// Product ID to tier mapping
const PRODUCT_ID_TO_TIER: Record<string, 'starter' | 'pro'> = {
  'prod_SF40NCVtZWsX05': 'starter', // Starter AI essentials
  'prod_RtcuCvjOY9gHvm': 'pro',     // Pro biohacker suite
};

// Price ID to tier mapping
const PRICE_ID_TO_TIER: Record<string, 'starter' | 'pro'> = {
  'price_1P9XCbBnKIqhVfskV6ZbkAy5': 'starter', // Monthly Starter
  'price_1P9XDQBnKIqhVfskuAZ3e7yX': 'starter', // Annual Starter
  'price_1P9XIsBnKIqhVfskAtrugJ6y': 'pro',     // Monthly Pro
  'price_1P9XJyBnKIqhVfsk5RBejxAu': 'pro',     // Annual Pro
};

/**
 * Get subscription tier from Stripe price ID
 * @param priceId Stripe price ID
 * @returns Subscription tier or 'free' if not found
 */
export function getTierFromPriceId(priceId?: string): 'free' | 'starter' | 'pro' {
  if (!priceId) return 'free';
  return PRICE_ID_TO_TIER[priceId] || 'free';
}

/**
 * Get subscription tier from Stripe product ID
 * @param productId Stripe product ID
 * @returns Subscription tier or 'free' if not found
 */
export function getTierFromProductId(productId?: string): 'free' | 'starter' | 'pro' {
  if (!productId) return 'free';
  return PRODUCT_ID_TO_TIER[productId] || 'free';
}