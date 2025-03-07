import React from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyLink: string;
  freeTrialLink: string;
}

/**
 * PaymentOptionsModal Component
 * Displays subscription options after user signup
 * Provides monthly, yearly, and free trial payment options
 * Links directly to Stripe checkout sessions
 */
const PaymentOptionsModal: React.FC<PaymentOptionsModalProps> = ({ isOpen, onClose, monthlyLink, freeTrialLink }) => {
  if (!isOpen) return null;

  const handlePaymentSelection = (url: string) => {
    // Open the payment URL in a new tab
    window.open(url, '_blank');
    // Then redirect to dashboard - user is already authenticated
    window.location.href = '/dashboard';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Choose Your Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center text-sm text-gray-500 mb-4">
            Get access to all features and personalized supplement recommendations
          </div>

          <div className="space-y-3">
            {/* Monthly subscription option - direct payment */}
            <a
              onClick={() => handlePaymentSelection(monthlyLink)}
              className="block w-full cursor-pointer"
            >
              <Button className="w-full bg-green-700 hover:bg-green-800">
                Monthly - $21.99
              </Button>
            </a>

            {/* Yearly subscription option with savings highlight */}
            <a 
              onClick={() => handlePaymentSelection("https://buy.stripe.com/eVa6rr9kw6GD9e8aEE")}
              className="block w-full cursor-pointer" 
            >
              <Button className="w-full" variant="outline">
                Yearly - $184.72 (Save 30%)
              </Button>
            </a>

            {/* Free trial option using the monthly link that includes 21-day trial */}
            <a 
              onClick={() => handlePaymentSelection(freeTrialLink)}
              className="block w-full cursor-pointer"
            >
              <Button className="w-full" variant="link">
                Start 14-Day Free Trial
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export {PaymentOptionsModal};