/**
 * Centralized configuration for Stripe price IDs
 * Used to map between product/price IDs and ensure consistency
 * across different parts of the application
 */
export declare const STRIPE_PRICE_MAP: Record<string, string>;
export declare const DIRECT_CHECKOUT_URLS: {
  'starter-monthly': string;
  'starter-yearly': string;
  'pro-monthly': string;
  'pro-yearly': string;
};
export declare function getPriceId(key: string): string;
export declare function shouldIncludeTrial(priceId: string): boolean;
export declare const SUBSCRIPTION_TIER_NAMES: {
  free: string;
  starter: string;
  pro: string;
};
//# sourceMappingURL=stripe-price-ids.d.ts.map
