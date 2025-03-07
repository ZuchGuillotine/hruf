import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Calendar, CreditCard } from "lucide-react";

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyLink: string;
  freeTrialLink: string;
}

/**
 * A modal that presents payment options to the user after signup
 * Includes monthly, yearly, and free trial options with links to Stripe
 */
export default function PaymentOptionsModal({ isOpen, onClose, monthlyLink, freeTrialLink }: PaymentOptionsModalProps) {
  console.log("PaymentOptionsModal rendered with isOpen:", isOpen);
  
  // Force focus trap to ensure modal is properly focused when opened
  React.useEffect(() => {
    if (isOpen) {
      console.log("Modal is open, ensuring visibility");
    }
  }, [isOpen]);
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log("Dialog open state changing to:", open);
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center">
            Select a subscription plan that works best for you
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Free Trial Option */}
            <div className="border rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all">
              <div className="font-medium flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span>14-Day Free Trial</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">Try all features for free, then $21.99/month</p>

              {/* Free trial option using the monthly link that includes 21-day trial */}
              <a 
                href={freeTrialLink}
                className="block w-full"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  Start Free Trial
                </Button>
              </a>
            </div>

            {/* Monthly Option */}
            <div className="border rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all">
              <div className="font-medium flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span>Monthly Plan</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">$21.99 per month, cancel anytime</p>

              <a 
                href={monthlyLink} 
                className="block w-full"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  Subscribe Monthly
                </Button>
              </a>
            </div>

            {/* Yearly Option */}
            <div className="border rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all bg-gray-50">
              <div className="font-medium flex items-center gap-2 mb-2">
                <BadgeCheck className="h-5 w-5 text-green-500" />
                <span>Yearly Plan</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-auto">Save 30%</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">$184.72 per year ($15.39/month)</p>

              <a 
                href="https://buy.stripe.com/eVa6rr9kw6GD9e8aEE" 
                className="block w-full"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="default" className="w-full">
                  Subscribe Yearly
                </Button>
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}