import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  Sparkles, 
  Star, 
  Loader2, 
  CreditCard
} from 'lucide-react';

import { 
  PRODUCTS, 
  getMonthlyPrice, 
  getYearlyPrice, 
  getSavingsPercentage, 
  getDirectCheckoutUrl,
  type SubscriptionInterval,
  type SubscriptionTier
} from '@/lib/stripe-price-ids';
import { useToast } from '@/hooks/use-toast';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: SubscriptionTier;
}

export function PaymentOptionsModal({ 
  isOpen, 
  onClose, 
  currentTier = 'free' 
}: PaymentOptionsModalProps) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    currentTier === 'free' ? 'starter' : 'pro'
  );
  const [billingInterval, setBillingInterval] = useState<SubscriptionInterval>('year');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Filter products to only show upgrades from current tier
  const availableProducts = PRODUCTS.filter(product => {
    if (currentTier === 'free') return product.id !== 'free';
    if (currentTier === 'starter') return product.id === 'pro';
    return false; // Pro users don't see upgrade options
  });

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      // Get the checkout URL based on the selected plan
      const directUrl = getDirectCheckoutUrl(selectedTier, billingInterval);
      
      if (!directUrl) {
        throw new Error('Invalid plan selection');
      }

      // For server-generated checkout sessions:
      /*
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PRODUCTS.find(p => p.id === selectedTier)?.prices[billingInterval].id,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/dashboard`,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
      */

      // For direct checkout URLs:
      window.location.href = directUrl;
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast({
        variant: 'destructive',
        title: 'Checkout Error',
        description: 'Unable to start checkout process. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade Your StackTracker Experience
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose the plan that's right for you and take your supplement tracking to the next level
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="year" className="mt-4" onValueChange={(value) => setBillingInterval(value as SubscriptionInterval)}>
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="year">
                Yearly
                <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                  Save {getSavingsPercentage('starter')}%
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="month" className="mt-4">
            <RadioGroup 
              value={selectedTier} 
              onValueChange={(value) => setSelectedTier(value as SubscriptionTier)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {availableProducts.map((product) => (
                <div 
                  key={product.id}
                  className={`relative rounded-lg border p-4 hover:border-primary hover:shadow transition-all ${
                    selectedTier === product.id ? 'border-primary border-2 shadow' : 'border-muted'
                  }`}
                >
                  <RadioGroupItem 
                    value={product.id} 
                    id={`plan-${product.id}-monthly`} 
                    className="sr-only" 
                  />
                  <Label 
                    htmlFor={`plan-${product.id}-monthly`}
                    className="flex flex-col h-full cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="flex items-center">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          {product.popular && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                              Popular
                            </span>
                          )}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">{getMonthlyPrice(product.id)}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2 flex-grow">
                      {product.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </Label>
                  {product.id === 'starter' && (
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                  )}
                  {product.id === 'pro' && (
                    <div className="absolute -top-2 -right-2">
                      <Star className="h-5 w-5 text-purple-500" />
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          </TabsContent>

          <TabsContent value="year" className="mt-4">
            <RadioGroup 
              value={selectedTier} 
              onValueChange={(value) => setSelectedTier(value as SubscriptionTier)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {availableProducts.map((product) => (
                <div 
                  key={product.id}
                  className={`relative rounded-lg border p-4 hover:border-primary hover:shadow transition-all ${
                    selectedTier === product.id ? 'border-primary border-2 shadow' : 'border-muted'
                  }`}
                >
                  <RadioGroupItem 
                    value={product.id} 
                    id={`plan-${product.id}-yearly`} 
                    className="sr-only" 
                  />
                  <Label 
                    htmlFor={`plan-${product.id}-yearly`}
                    className="flex flex-col h-full cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="flex items-center">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          {product.popular && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                              Popular
                            </span>
                          )}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground line-through">
                          {getMonthlyPrice(product.id)} × 12
                        </p>
                        <span className="text-2xl font-bold">{getYearlyPrice(product.id)}</span>
                        <span className="text-muted-foreground">/year</span>
                        <p className="text-xs text-green-600">
                          Save {getSavingsPercentage(product.id)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2 flex-grow">
                      {product.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </Label>
                  {product.id === 'starter' && (
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                  )}
                  {product.id === 'pro' && (
                    <div className="absolute -top-2 -right-2">
                      <Star className="h-5 w-5 text-purple-500" />
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-6">
          <Button variant="outline" onClick={onClose} className="sm:mr-2 w-full sm:w-auto">
            Continue with Free Plan
          </Button>
          <Button 
            onClick={handleUpgrade} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}