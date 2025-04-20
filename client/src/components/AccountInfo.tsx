import { useUser } from '../hooks/use-user';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { CalendarIcon, CreditCardIcon, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';

export function AccountInfo() {
  const { user } = useUser();
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch streak information on component mount
    const fetchStreak = async () => {
      try {
        const response = await fetch('/api/supplements/streak', {
          credentials: 'include' // Important for auth
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch streak data');
        }

        const data = await response.json();
        setStreakDays(data.streakDays);
      } catch (error: any) {
        console.error('Failed to fetch streak:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load streak data"
        });
      }
    };
    fetchStreak();
  }, [toast]);

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getRemainingDays = (trialEndDate: string | null) => {
    if (!trialEndDate) return 0;
    const end = new Date(trialEndDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleExtendTrial = async () => {
    if (loading || streakDays < 14) return;
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/extend-trial', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to extend trial');
      }

      toast({
        title: "Success!",
        description: "Your trial has been extended by 7 days!",
      });

      // Refresh page to update trial end date
      window.location.reload();
    } catch (error) {
      console.error('Failed to extend trial:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to extend trial period"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <h3 className="text-lg font-semibold">Account Status</h3>
        {!user?.isPro && user?.trialEndsAt && (
          <div className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            Free Trial
          </div>
        )}
        {user?.isPro && (
          <div className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
            Pro
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="space-y-1">
          {!user?.isPro && (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">
                    {user?.trialEndsAt ? 
                      `${getRemainingDays(user.trialEndsAt)} days remaining in trial` : 
                      'Trial not started'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {user?.trialEndsAt ? 
                    'Upgrade now to keep access to all features' :
                    'Start your trial to access all features'}
                </p>
              </div>

              {/* Trial Extension Reward */}
              {streakDays > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">
                      Logging Streak: {streakDays} days
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress value={(streakDays / 14) * 100} className="h-2" />
                  </div>
                  {streakDays >= 14 ? (
                    <Button
                      onClick={handleExtendTrial}
                      disabled={loading}
                      className="mt-2 w-full bg-blue-500 hover:bg-blue-600"
                    >
                      {loading ? "Processing..." : "Claim 7 Extra Trial Days!"}
                    </Button>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">
                      Log your supplements for {14 - streakDays} more days to earn 7 extra trial days!
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {user?.isPro && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCardIcon className="w-4 h-4" />
              <span>Next billing date: {formatDate(user?.subscriptionEndsAt)}</span>
            </div>
          )}
        </div>

        {!user?.isPro && (
          <div className="space-y-3">
            <Button 
              className="w-full bg-green-700 hover:bg-green-800"
              onClick={() => handleSubscribe(false)}
              disabled={loading}
            >
              Monthly - $21.99
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleSubscribe(true)}
              disabled={loading}
            >
              Yearly - $184.72 (Save 30%)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const handleSubscribe = async (isYearly: boolean) => {
  const priceId = isYearly 
    ? 'price_yearly_id'  // Replace with your actual yearly price ID
    : 'price_monthly_id'; // Replace with your actual monthly price ID

  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    });

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
  }
};