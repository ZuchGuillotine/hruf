/**
 * Utility functions for Stripe integration
 */

// Map product IDs to their subscription tiers
const PRODUCT_TO_TIER_MAP: Record<string, 'free' | 'starter' | 'pro'> = {
  'prod_SF40NCVtZWsX05': 'starter', // Starter AI essentials
  'prod_RtcuCvjOY9gHvm': 'pro',     // Pro biohacker suite
};

/**
 * Get subscription tier from Stripe product ID
 * @param productId Stripe product ID 
 * @returns 'starter', 'pro', or 'free' if not found
 */
export function getTierFromProductId(productId: string): 'free' | 'starter' | 'pro' {
  return PRODUCT_TO_TIER_MAP[productId] || 'free';
}