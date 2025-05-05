import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
// import { useNavigate } from 'react-router-dom'; //Removed as useNavigate is not used
import { CalendarIcon, CheckCircle } from 'lucide-react';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentOptionsModal({ isOpen, onClose }: PaymentOptionsModalProps) {
  const [loading, setLoading] = useState(false);
  // const navigate = useNavigate(); //Removed as useNavigate is not used

  const handleSubscribe = async (planType: 'monthlyWithTrial' | 'monthly' | 'yearly') => {
    try {
      setLoading(true);

      // For the free trial option, redirect to Stripe's hosted page
      if (planType === 'monthlyWithTrial') {
        window.location.href = 'https://buy.stripe.com/eVa6rr9kw6GD9e8aEE';
        return;
      }

      // For paid options, create checkout session
      let priceId;
      switch (planType) {
        case 'yearly':
          priceId = 'prod_RpdfGxB4L6Rut7';
          break;
        case 'monthly':
          priceId = 'prod_RtcuCvjOY9gHvm';
          break;
        default:
          throw new Error('Invalid plan type');
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

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
              onClick={() => handleSubscribe('monthlyWithTrial')}
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