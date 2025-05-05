/**
 * Stripe Product and Price IDs
 * These are used to generate checkout links for different subscription tiers
 */

// Products
export const PRODUCTS = {
  // Starter tier
  STARTER: {
    id: 'prod_SF40NCVtZWsX05',
    name: 'AI Health Essentials',
    description: 'Essential AI-powered health tracking features',
    tiers: {
      MONTHLY: {
        id: 'price_1PYgagEPVsRFmPXiDOy7rU9x',
        price: 21.99,
        url: 'https://buy.stripe.com/6oEdTTeEQaWT76028b',
        interval: 'month'
      },
      YEARLY: {
        id: 'price_1PYgagEPVsRFmPXi2QiE9gBZ',
        price: 184.71,
        url: 'https://buy.stripe.com/eVa177aoAfd94XSbIM',
        interval: 'year',
        discount: 30
      }
    }
  },
  
  // Pro tier
  PRO: {
    id: 'prod_RtcuCvjOY9gHvm',
    name: 'Premium Biohacker',
    description: 'Advanced health tracking and AI insights',
    tiers: {
      MONTHLY: {
        id: 'price_1PYgagEPVsRFmPXiBcPHNmvk',
        price: 49.99,
        url: 'https://buy.stripe.com/5kA5nn8gs7KH8a428e',
        interval: 'month'
      },
      YEARLY: {
        id: 'price_1PYgagEPVsRFmPXiexLxlKNF',
        price: 419.88,
        url: 'https://buy.stripe.com/8wM8zzfIU6GD760bIP',
        interval: 'year',
        discount: 30
      }
    }
  }
};

/**
 * Maps product name to its subscription tier in the database
 */
export const PRODUCT_TO_TIER_MAP = {
  [PRODUCTS.STARTER.id]: 'starter',
  [PRODUCTS.PRO.id]: 'pro'
};

/**
 * Get subscription tier from product ID
 */
export function getTierFromProductId(productId: string): string {
  return PRODUCT_TO_TIER_MAP[productId] || 'free';
}

/**
 * Get Stripe checkout URL for a specific tier and billing interval
 */
export function getCheckoutUrl(tier: 'STARTER' | 'PRO', interval: 'MONTHLY' | 'YEARLY'): string {
  return PRODUCTS[tier].tiers[interval].url;
}

/**
 * Generate server-side checkout session (alternative to direct links)
 * This allows for better tracking and customized success/cancel URLs
 */
export async function createCheckoutSession(
  tier: 'STARTER' | 'PRO', 
  interval: 'MONTHLY' | 'YEARLY',
  customerId?: string,
  metadata?: Record<string, string>
): Promise<{ url: string }> {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: PRODUCTS[tier].tiers[interval].id,
        customerId,
        metadata
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    // Fallback to direct URL if server-side session fails
    return { url: PRODUCTS[tier].tiers[interval].url };
  }
}