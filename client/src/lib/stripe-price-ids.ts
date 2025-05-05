/**
 * Stripe product and price information
 * 
 * This file contains the configuration for subscription tiers and their corresponding Stripe price IDs.
 * The different tiers map to different feature sets and permissions in the application.
 * 
 * Product IDs:
 * - Starter AI Essentials: prod_SF40NCVtZWsX05
 * - Pro Biohacker Suite: prod_RtcuCvjOY9gHvm
 */

export type SubscriptionInterval = 'month' | 'year';
export type SubscriptionTier = 'free' | 'starter' | 'pro';

export interface PriceInfo {
  id: string;
  value: number;
  currency: string;
  interval: SubscriptionInterval;
  directCheckoutUrl: string;
}

export interface TierInfo {
  id: SubscriptionTier;
  name: string;
  description: string;
  productId: string;
  prices: Record<SubscriptionInterval, PriceInfo>;
  features: string[];
  popular?: boolean;
}

// Subscription tiers and their features
export const PRODUCTS: TierInfo[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic tracking for casual users',
    productId: '',
    prices: {
      month: {
        id: '',
        value: 0,
        currency: 'usd',
        interval: 'month',
        directCheckoutUrl: ''
      },
      year: {
        id: '',
        value: 0,
        currency: 'usd',
        interval: 'year',
        directCheckoutUrl: ''
      }
    },
    features: [
      'Up to 10 supplements tracked',
      'Basic supplement logs',
      'Health stats tracking',
      'Weekly summaries',
      'Qualitative journaling'
    ]
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'AI essentials for supplement optimization',
    productId: 'prod_SF40NCVtZWsX05',
    popular: true,
    prices: {
      month: {
        id: 'price_1OFQdpKMPzK0sB1a8XaTsO1v',
        value: 2199,
        currency: 'usd',
        interval: 'month',
        directCheckoutUrl: 'https://buy.stripe.com/6oEdTTeEQaWT76028b'
      },
      year: {
        id: 'price_1OD9ApKMPzK0sB1aXKK79Rql',
        value: 18471,
        currency: 'usd',
        interval: 'year',
        directCheckoutUrl: 'https://buy.stripe.com/eVa177aoAfd94XSbIM'
      }
    },
    features: [
      'Everything in Free',
      'Unlimited supplement tracking',
      'AI-powered insights & analysis',
      'Advanced supplement queries',
      'Personalized recommendations',
      'AI supplement chat',
      'Daily summaries',
      'Premium content access'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Complete suite for serious biohackers',
    productId: 'prod_RtcuCvjOY9gHvm',
    prices: {
      month: {
        id: 'price_1OQGd7KMPzK0sB1aKDDPZKcX',
        value: 4999,
        currency: 'usd',
        interval: 'month',
        directCheckoutUrl: 'https://buy.stripe.com/5kA5nn8gs7KH8a428e'
      },
      year: {
        id: 'price_1OQGd7KMPzK0sB1a4kP3wVuR',
        value: 41991,
        currency: 'usd',
        interval: 'year',
        directCheckoutUrl: 'https://buy.stripe.com/8wM8zzfIU6GD760bIP'
      }
    },
    features: [
      'Everything in Starter',
      'Lab result analysis & tracking',
      'Advanced health biomarker analytics',
      'Actionable supplement insights',
      'Full health research database',
      'Correlation analysis',
      'Priority support',
      'Early access to new features'
    ]
  }
];

// Helper functions
export function getTierFromProductId(productId: string): SubscriptionTier {
  const product = PRODUCTS.find(p => p.productId === productId);
  return product?.id || 'free';
}

export function getTierFromPriceId(priceId: string): SubscriptionTier {
  for (const product of PRODUCTS) {
    if (product.prices.month.id === priceId || product.prices.year.id === priceId) {
      return product.id;
    }
  }
  return 'free';
}

export function getProduct(tier: SubscriptionTier): TierInfo | undefined {
  return PRODUCTS.find(p => p.id === tier);
}

export function getProductByPrice(priceId: string): TierInfo | undefined {
  return PRODUCTS.find(
    p => p.prices.month.id === priceId || p.prices.year.id === priceId
  );
}

export function getFeaturesByTier(tier: SubscriptionTier): string[] {
  const product = getProduct(tier);
  return product?.features || [];
}

export function getPriceValue(tier: SubscriptionTier, interval: SubscriptionInterval): number {
  const product = getProduct(tier);
  return product?.prices[interval].value || 0;
}

export function getPriceId(tier: SubscriptionTier, interval: SubscriptionInterval): string {
  const product = getProduct(tier);
  return product?.prices[interval].id || '';
}

export function getDirectCheckoutUrl(tier: SubscriptionTier, interval: SubscriptionInterval): string {
  const product = getProduct(tier);
  return product?.prices[interval].directCheckoutUrl || '';
}

export function formatPrice(value: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(value / 100);
}

export function getMonthlyPrice(tier: SubscriptionTier): string {
  const product = getProduct(tier);
  if (!product) return '$0';
  return formatPrice(product.prices.month.value);
}

export function getYearlyPrice(tier: SubscriptionTier): string {
  const product = getProduct(tier);
  if (!product) return '$0';
  return formatPrice(product.prices.year.value);
}

export function getYearlySavings(tier: SubscriptionTier): string {
  const product = getProduct(tier);
  if (!product) return '$0';
  
  const monthlyTotal = product.prices.month.value * 12;
  const yearlyCost = product.prices.year.value;
  
  if (monthlyTotal <= yearlyCost) return '$0';
  
  const savings = monthlyTotal - yearlyCost;
  return formatPrice(savings);
}

export function getSavingsPercentage(tier: SubscriptionTier): number {
  const product = getProduct(tier);
  if (!product) return 0;
  
  const monthlyTotal = product.prices.month.value * 12;
  const yearlyCost = product.prices.year.value;
  
  if (monthlyTotal <= yearlyCost) return 0;
  
  return Math.round((1 - (yearlyCost / monthlyTotal)) * 100);
}