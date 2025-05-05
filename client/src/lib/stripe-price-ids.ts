// Centralized configuration for Stripe price IDs
export const STRIPE_PRICES = {
  // Monthly plans
  MONTHLY_STARTER: 'prod_RtcuCvjOY9gHvm', // $7.99/month
  MONTHLY_PRO: 'prod_RpdfGxB4L6Rut7', // $14.99/month
  
  // Yearly plans (with discounts)
  YEARLY_STARTER: 'price_starter_yearly', // $69/year
  YEARLY_PRO: 'price_pro_yearly', // $99/year
};

// Helper functions to get appropriate price ID
export function getMonthlyStarter() {
  return import.meta.env.VITE_STRIPE_MONTHLY_STARTER_ID || STRIPE_PRICES.MONTHLY_STARTER;
}

export function getMonthlyPro() {
  return import.meta.env.VITE_STRIPE_MONTHLY_PRO_ID || STRIPE_PRICES.MONTHLY_PRO;
}

export function getYearlyStarter() {
  return import.meta.env.VITE_STRIPE_YEARLY_STARTER_ID || STRIPE_PRICES.YEARLY_STARTER;
}

export function getYearlyPro() {
  return import.meta.env.VITE_STRIPE_YEARLY_PRO_ID || STRIPE_PRICES.YEARLY_PRO;
}

export function getPriceIdByPlan(plan: 'starter-monthly' | 'starter-yearly' | 'pro-monthly' | 'pro-yearly') {
  switch (plan) {
    case 'starter-monthly':
      return getMonthlyStarter();
    case 'starter-yearly':
      return getYearlyStarter();
    case 'pro-monthly':
      return getMonthlyPro();
    case 'pro-yearly':
      return getYearlyPro();
    default:
      return getMonthlyStarter();
  }
}