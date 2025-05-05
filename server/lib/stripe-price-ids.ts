/**
 * Centralized configuration for Stripe price IDs
 * Used to map between product/price IDs and ensure consistency 
 * across different parts of the application
 */

// Price ID mapping for all subscription tiers
export const STRIPE_PRICE_MAP: Record<string, string> = {
  // Starter tier pricing
  'prod_SF40NCVtZWsX05': 'price_1OpGHMAIJBVVerrJCXB9LK8z', // Starter Monthly
  'starter-monthly': 'price_1OpGHMAIJBVVerrJCXB9LK8z',     // Starter Monthly (alternate key)
  'starter-yearly': 'price_1OpGHMAIJBVVerrJvkT9T8Nw',      // Starter Yearly
  
  // Pro tier pricing
  'prod_RtcuCvjOY9gHvm': 'price_1OpGHMAIJBVVerrJzYX9T8Nw', // Pro Monthly
  'pro-monthly': 'price_1OpGHMAIJBVVerrJzYX9T8Nw',         // Pro Monthly (alternate key)
  'pro-yearly': 'price_1OpGHMAIJBVVerrJwXY9T8Nw',          // Pro Yearly
};

// Original direct checkout URLs for fallback
export const DIRECT_CHECKOUT_URLS = {
  'starter-monthly': 'https://buy.stripe.com/6oEdTTeEQaWT76028b',
  'starter-yearly': 'https://buy.stripe.com/eVa177aoAfd94XSbIM',
  'pro-monthly': 'https://buy.stripe.com/5kA5nn8gs7KH8a428e',
  'pro-yearly': 'https://buy.stripe.com/8wM8zzfIU6GD760bIP',
};

// Helper function to get price ID from key
export function getPriceId(key: string): string {
  return STRIPE_PRICE_MAP[key] || key;
}

// Helper function to determine if a plan should include a trial
export function shouldIncludeTrial(priceId: string): boolean {
  return priceId.includes('starter') || 
    priceId.includes('price_1OpGHMAIJBVVerrJCXB9LK8z') || 
    priceId.includes('price_1OpGHMAIJBVVerrJvkT9T8Nw');
}

// Map subscription tier names (stored in DB) to human-readable names
export const SUBSCRIPTION_TIER_NAMES = {
  'free': 'Free Tier',
  'starter': 'Starter AI Essentials',
  'pro': 'Pro Biohacker Suite'
};