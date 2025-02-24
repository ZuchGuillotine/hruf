
import { useUser } from '../hooks/use-user';
import { Button } from './ui/button';
import { useState } from 'react';

/**
 * SubscriptionCheck Component
 * Displays a call-to-action for non-pro users to upgrade their subscription
 * Handles redirection to Stripe checkout for payment processing
 * Only appears for users without a pro subscription
 */
export function SubscriptionCheck() {
  // Get current user data from context
  const { user } = useUser();
  // Loading state for payment processing
  const [loading, setLoading] = useState(false);

  /**
   * Initiates the subscription process
   * Creates a Stripe checkout session and redirects user to payment page
   * @param isYearly - Boolean flag for yearly vs monthly subscription
   */
  const handleSubscribe = async (isYearly: boolean) => {
    setLoading(true);
    try {
      // Select price ID based on subscription period
      const priceId = isYearly ? process.env.STRIPE_YEARLY_PRICE_ID : process.env.STRIPE_MONTHLY_PRICE_ID;
      
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      
      // Redirect to Stripe checkout
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to start subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything for pro users
  if (user?.isPro) return null;

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
      <p className="mb-4">Unlock unlimited chat and more features!</p>
      <div className="space-x-4">
        {/* Monthly subscription button */}
        <Button onClick={() => handleSubscribe(false)} disabled={loading}>
          Monthly - $21.99
        </Button>
        {/* Yearly subscription button with savings highlight */}
        <Button onClick={() => handleSubscribe(true)} disabled={loading} variant="outline">
          Yearly - $184.71 (Save 30%)
        </Button>
      </div>
    </div>
  );
}
