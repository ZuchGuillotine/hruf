
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentOptionsModal({ isOpen, onClose }: PaymentOptionsModalProps) {
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
            {/* Monthly subscription option */}
            <Button
              onClick={() => handleSubscribe(false)}
              className="w-full bg-green-700 hover:bg-green-800"
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
            
            {/* Free trial option */}
            <a 
              href="#"
              className="block w-full"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  const response = await fetch('/api/stripe/start-free-trial', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to start free trial');
                  }
                  
                  // Close modal and redirect to dashboard
                  onClose();
                  window.location.href = '/dashboard';
                } catch (error) {
                  console.error('Free trial error:', error);
                  // You could show an error message here
                }
              }}
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
}
