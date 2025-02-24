
import { useUser } from '../hooks/use-user';
import { Button } from './ui/button';
import { useState } from 'react';

export function SubscriptionCheck() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (isYearly: boolean) => {
    setLoading(true);
    try {
      const priceId = isYearly ? process.env.STRIPE_YEARLY_PRICE_ID : process.env.STRIPE_MONTHLY_PRICE_ID;
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to start subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.isPro) return null;

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
      <p className="mb-4">Unlock unlimited chat and more features!</p>
      <div className="space-x-4">
        <Button onClick={() => handleSubscribe(false)} disabled={loading}>
          Monthly - $21.99
        </Button>
        <Button onClick={() => handleSubscribe(true)} disabled={loading} variant="outline">
          Yearly - $184.71 (Save 30%)
        </Button>
      </div>
    </div>
  );
}
