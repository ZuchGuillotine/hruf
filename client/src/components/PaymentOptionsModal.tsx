import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { getMonthlyPro, getYearlyPro } from '@/lib/stripe-price-ids';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentOptionsModal({ isOpen, onClose }: PaymentOptionsModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();

  const handleStartFreeTrial = async () => {
    try {
      setLoading(true);
      
      // Call the free trial API endpoint
      const response = await fetch('/api/stripe/start-free-trial', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start free trial');
      }
      
      toast({
        title: "Free Trial Started",
        description: "Your 28-day free trial has started. Enjoy!",
      });
      
      // After successful trial setup, redirect to the dashboard
      window.location.href = '/';
    } catch (error: any) {
      console.error('Free trial error:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start free trial",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    try {
      setLoading(true);

      // For paid options, get price ID from our centralized config
      const priceId = planType === 'yearly' 
        ? getYearlyPro() 
        : getMonthlyPro();

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      console.error('Subscription error:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process subscription",
      });
    } finally {
      setLoading(false);
    }
  };

  // This modal should only show after a free tier signup
  // No additional checks needed as it's controlled by the parent component
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Choose Your Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center text-sm text-gray-500 mb-4">
            Start your journey with StackTracker Pro!
          </div>

          <div className="space-y-3">
            {/* Free Trial Option */}
            <Button 
              onClick={handleStartFreeTrial}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {loading ? "Processing..." : "Start 28-Day Free Trial"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or subscribe now</span>
              </div>
            </div>

            {/* Monthly Option */}
            <Button 
              onClick={() => handleSubscribe('monthly')}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processing..." : "Monthly - $21.99/month"}
            </Button>

            {/* Yearly Option */}
            <Button 
              onClick={() => handleSubscribe('yearly')}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Processing..." : "Yearly - $184.71/year (Save 30%)"}
            </Button>

            <div className="space-y-2 text-sm text-gray-500 mt-4">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Unlimited AI Interactions
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Advanced Analytics
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Priority Support
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}