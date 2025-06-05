/**
 * Stripe product and price information
 *
 * These values need to match what is set up in your Stripe dashboard.
 *
 * Usage:
 * - TIERS: used directly in the subscription UI to display plans and prices
 * - PRODUCTS: used to map product IDs to their respective tiers
 */
export type TierInfo = {
  id: string;
  price: number;
  url: string;
};
export declare const TIERS: {
  starter: {
    MONTHLY: {
      id: string;
      price: number;
      url: string;
    };
    YEARLY: {
      id: string;
      price: number;
      url: string;
    };
  };
  pro: {
    MONTHLY: {
      id: string;
      price: number;
      url: string;
    };
    YEARLY: {
      id: string;
      price: number;
      url: string;
    };
  };
};
export declare const PRODUCTS: {
  prod_SF40NCVtZWsX05: {
    name: string;
    tier: string;
  };
  prod_RtcuCvjOY9gHvm: {
    name: string;
    tier: string;
  };
};
/**
 * Helper to get the tier from a price ID
 * @param priceId Stripe price ID
 * @returns 'starter', 'pro', or 'free' if not found
 */
export declare function getTierFromPriceId(priceId: string): 'free' | 'starter' | 'pro';
//# sourceMappingURL=stripe-price-ids.d.ts.map
