
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { TIERS } from '@/lib/stripe-price-ids';

export function ProfileCompletionNotification() {
  const { user } = useUser();
  
  if (!user) return null;

  const renderFreeTierCard = () => (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Free Core Account</CardTitle>
        <CardDescription>Basic supplement tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span>Basic supplement tracking</span>
        </div>
        <div className="text-sm text-muted-foreground mt-4">
          Upgrade to unlock AI analysis and advanced features
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          className="w-1/2"
          onClick={() => window.location.href = TIERS.starter.MONTHLY.url}
        >
          Starter ${TIERS.starter.MONTHLY.price}/mo
        </Button>
        <Button 
          className="w-1/2"
          onClick={() => window.location.href = TIERS.pro.MONTHLY.url}
        >
          Pro ${TIERS.pro.MONTHLY.price}/mo
        </Button>
      </CardFooter>
    </Card>
  );

  const renderStarterTierCard = () => (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Starter AI Essentials</CardTitle>
        <CardDescription>AI-powered health optimization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span>100 AI interactions per month</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span>3 lab result analyses per year</span>
        </div>
        <div className="text-sm text-muted-foreground mt-4">
          Upgrade to Pro for unlimited features
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={() => window.location.href = TIERS.pro.YEARLY.url}
        >
          Upgrade to Pro ${(TIERS.pro.YEARLY.price / 12).toFixed(2)}/mo (Annual)
        </Button>
      </CardFooter>
    </Card>
  );

  const renderProTierCard = () => (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Pro Biohacker Suite</CardTitle>
        <CardDescription>Advanced health optimization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span>Unlimited AI interactions</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span>Unlimited lab result analyses</span>
        </div>
        {user.subscriptionInterval === 'MONTHLY' && (
          <div className="text-sm text-muted-foreground mt-4">
            Save ${(TIERS.pro.MONTHLY.price * 12 - TIERS.pro.YEARLY.price).toFixed(2)} per year by switching to annual billing
          </div>
        )}
      </CardContent>
      {user.subscriptionInterval === 'MONTHLY' && (
        <CardFooter>
          <Button 
            className="w-full"
            onClick={() => window.location.href = TIERS.pro.YEARLY.url}
          >
            Switch to Annual (Save ${(TIERS.pro.MONTHLY.price * 12 - TIERS.pro.YEARLY.price).toFixed(2)}/yr)
          </Button>
        </CardFooter>
      )}
    </Card>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      {user.subscriptionTier === 'free' && renderFreeTierCard()}
      {user.subscriptionTier === 'starter' && renderStarterTierCard()}
      {user.subscriptionTier === 'pro' && renderProTierCard()}
    </div>
  );
}
