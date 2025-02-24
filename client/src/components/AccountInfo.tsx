
import { useUser } from '../hooks/use-user';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { CalendarIcon, CreditCardIcon } from 'lucide-react';

/**
 * AccountInfo Component
 * Displays user subscription status and payment options
 * Shows trial period countdown for free users
 * Displays subscription renewal date for pro users
 * Provides direct payment links for subscription upgrades
 */
export function AccountInfo() {
  // Get current user data from context
  const { user } = useUser();

  /**
   * Formats a date string to local date format
   * @param date - ISO date string or null
   * @returns Formatted date string or 'N/A' if date is null
   */
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  /**
   * Calculates remaining days in trial period
   * @param trialEndDate - ISO date string for trial end or null
   * @returns Number of days remaining (minimum 0)
   */
  const getRemainingDays = (trialEndDate: string | null) => {
    if (!trialEndDate) return 0;
    const end = new Date(trialEndDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Account Status</h3>
        {/* Status badge changes color based on subscription status */}
        <div className={`px-2 py-1 rounded-full text-sm ${user?.isPro ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
          {user?.isPro ? 'Pro' : 'Free Trial'}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {/* Display trial countdown for free users */}
          {!user?.isPro && user?.trialEndsAt && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4 text-orange-500" />
              <span className="font-medium">
                {getRemainingDays(user.trialEndsAt)} days remaining in trial
              </span>
            </div>
          )}
          {/* Display next billing date for pro users */}
          {user?.isPro && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCardIcon className="w-4 h-4" />
              <span>Next billing date: {formatDate(user?.subscriptionEndsAt)}</span>
            </div>
          )}
        </div>
        
        {/* Subscription upgrade options for free users */}
        {!user?.isPro && (
          <div className="space-y-3">
            {/* Monthly subscription option */}
            <a 
              href="https://buy.stripe.com/eVa6rr9kw6GD9e8aEE" 
              className="block w-full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-green-700 hover:bg-green-800">
                Monthly - $21.99
              </Button>
            </a>
            {/* Yearly subscription option with savings highlight */}
            <a 
              href="https://buy.stripe.com/eVa6rr9kw6GD9e8aEE"
              className="block w-full" 
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full" variant="outline">
                Yearly - $184.72 (Save 30%)
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
