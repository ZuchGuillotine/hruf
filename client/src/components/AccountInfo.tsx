
import { useUser } from '../hooks/use-user';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { CalendarIcon, CreditCardIcon } from 'lucide-react';

export function AccountInfo() {
  const { user } = useUser();

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Account Status</h3>
        <div className={`px-2 py-1 rounded-full text-sm ${user?.isPro ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
          {user?.isPro ? 'Pro' : 'Free'}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>Trial ends: {formatDate(user?.trialEndsAt)}</span>
          </div>
          {user?.isPro && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCardIcon className="w-4 h-4" />
              <span>Next billing date: {formatDate(user?.subscriptionEndsAt)}</span>
            </div>
          )}
        </div>
        
        {!user?.isPro && (
          <Button className="w-full" onClick={() => window.location.href = '/upgrade'}>
            Upgrade to Pro
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
