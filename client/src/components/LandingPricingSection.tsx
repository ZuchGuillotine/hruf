import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, ArrowRight } from "lucide-react";
import { TIERS } from "@/lib/stripe-price-ids";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function LandingPricingSection() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Calculate annual savings
  const calculateSavings = (tier: 'starter' | 'pro') => {
    const monthly = TIERS[tier].MONTHLY.price;
    const yearly = TIERS[tier].YEARLY.price;
    const annualMonthly = monthly * 12;
    const savings = Math.round(((annualMonthly - yearly) / annualMonthly) * 100);
    return savings;
  };

  // When a user clicks a buy button, we need to:
  // 1. If they're already logged in, redirect to direct upgrade link with return URL
  // 2. If they're not logged in, redirect to Stripe directly with return URL pointing to signup
  const handlePurchaseClick = (tier: 'starter' | 'pro', interval: 'MONTHLY' | 'YEARLY') => {
    setIsLoading(`${tier}-${interval}`);
    
    // Get the direct Stripe checkout URL
    const stripeCheckoutUrl = TIERS[tier][interval].url;
    
    // Create the success redirect URL (our domain + /payment-success)
    const successRedirectUrl = encodeURIComponent(`${window.location.origin}/payment-success`);
    
    // Append our success URL to the Stripe checkout URL
    // This uses Stripe's redirect parameters to return users to our site after payment
    const fullCheckoutUrl = `${stripeCheckoutUrl}?client_reference_id=landingpage&redirect_url=${successRedirectUrl}`;
    
    // Redirect to Stripe checkout
    window.location.href = fullCheckoutUrl;
  };

  return (
    <section className="container max-w-7xl py-16 md:py-24" id="pricing">
      <div className="mx-auto mb-12 max-w-xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-4 text-muted-foreground">
          Choose the plan that works best for your health optimization journey.
          All plans include access to core features with different usage limits.
        </p>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Save 15-20%</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Monthly Plans */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Free Plan */}
            <Card className="border-2 border-muted flex flex-col justify-between">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Basic tracking for casual users</CardDescription>
                <div className="mt-2 text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>3 supplement entries per day</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>1 AI health chat per day</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Basic health tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Community access</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2" 
                  variant="outline"
                  onClick={() => window.location.href = "/auth?action=signup"}
                >
                  Sign Up Free <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Starter Plan */}
            <Card className="border-2 border-primary/20 hover:border-primary/50 transition-all flex flex-col justify-between">
              <CardHeader>
                <CardTitle>Starter AI Essentials</CardTitle>
                <CardDescription>Essential AI features for health optimization beginners</CardDescription>
                <div className="mt-2 text-3xl font-bold">${TIERS.starter.MONTHLY.price}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>3 AI health chats per day</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>10 Lab result uploads per month</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Basic supplement tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Weekly health insights</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2"
                  onClick={() => handlePurchaseClick('starter', 'MONTHLY')}
                  disabled={!!isLoading}
                >
                  {isLoading === 'starter-MONTHLY' ? (
                    <><LoadingSpinner size="sm" /> Processing...</>
                  ) : (
                    <>Get Started <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary shadow-lg hover:border-primary/90 transition-all flex flex-col justify-between">
              <CardHeader>
                <div className="bg-primary text-primary-foreground text-xs rounded-full px-2.5 py-0.5 w-fit mb-2">MOST POPULAR</div>
                <CardTitle>Pro Biohacker Suite</CardTitle>
                <CardDescription>Advanced features for the dedicated health optimizer</CardDescription>
                <div className="mt-2 text-3xl font-bold">${TIERS.pro.MONTHLY.price}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited</strong> AI health chats</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited</strong> lab result uploads</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Advanced supplement tracking with insights</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Daily personalized health recommendations</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Priority feature releases</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2"
                  onClick={() => handlePurchaseClick('pro', 'MONTHLY')}
                  disabled={!!isLoading}
                >
                  {isLoading === 'pro-MONTHLY' ? (
                    <><LoadingSpinner size="sm" /> Processing...</>
                  ) : (
                    <>Upgrade to Pro <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Yearly Plans */}
        <TabsContent value="yearly" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Free Plan */}
            <Card className="border-2 border-muted flex flex-col justify-between">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Basic tracking for casual users</CardDescription>
                <div className="mt-2 text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>3 supplement entries per day</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>1 AI health chat per day</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Basic health tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Community access</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2" 
                  variant="outline"
                  onClick={() => window.location.href = "/auth?action=signup"}
                >
                  Sign Up Free <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Starter Plan */}
            <Card className="border-2 border-primary/20 hover:border-primary/50 transition-all flex flex-col justify-between">
              <CardHeader>
                <CardTitle>Starter AI Essentials</CardTitle>
                <CardDescription>Essential AI features for health optimization beginners</CardDescription>
                <div className="mt-2 text-3xl font-bold">${(TIERS.starter.YEARLY.price / 12).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <div className="text-sm text-primary">Save {calculateSavings('starter')}% with annual billing</div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>3 AI health chats per day</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>10 Lab result uploads per month</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Basic supplement tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Weekly health insights</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2"
                  onClick={() => handlePurchaseClick('starter', 'YEARLY')}
                  disabled={!!isLoading}
                >
                  {isLoading === 'starter-YEARLY' ? (
                    <><LoadingSpinner size="sm" /> Processing...</>
                  ) : (
                    <>Get Annual Plan <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary shadow-lg hover:border-primary/90 transition-all flex flex-col justify-between">
              <CardHeader>
                <div className="bg-primary text-primary-foreground text-xs rounded-full px-2.5 py-0.5 w-fit mb-2">BEST VALUE</div>
                <CardTitle>Pro Biohacker Suite</CardTitle>
                <CardDescription>Advanced features for the dedicated health optimizer</CardDescription>
                <div className="mt-2 text-3xl font-bold">${(TIERS.pro.YEARLY.price / 12).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <div className="text-sm text-primary">Save {calculateSavings('pro')}% with annual billing</div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited</strong> AI health chats</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited</strong> lab result uploads</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Advanced supplement tracking with insights</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Daily personalized health recommendations</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Priority feature releases</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2"
                  onClick={() => handlePurchaseClick('pro', 'YEARLY')}
                  disabled={!!isLoading}
                >
                  {isLoading === 'pro-YEARLY' ? (
                    <><LoadingSpinner size="sm" /> Processing...</>
                  ) : (
                    <>Upgrade to Annual Pro <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-muted-foreground mt-12">
        All plans include a 14-day money-back guarantee. No questions asked.
        <br />Need a custom enterprise plan? <a href="/contact" className="text-primary hover:underline">Contact us</a> for details.
      </div>
    </section>
  );
}