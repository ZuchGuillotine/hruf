
import React from 'react';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyLink: string;
  freeTrialLink: string;
}

/**
 * Modal component that displays payment options after a user signs up.
 */
const PaymentOptionsModal: React.FC<PaymentOptionsModalProps> = ({ 
  isOpen, 
  onClose,
  monthlyLink,
  freeTrialLink
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-teal-400 py-4 px-6">
          <h2 className="text-xl font-bold text-white">Choose Your Plan</h2>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Thank you for signing up! Please select a plan to continue:
          </p>
          
          <div className="space-y-4">
            {/* Monthly plan option */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg">Monthly Plan</h3>
              <p className="text-gray-600 mb-2">$21.99 per month</p>
              <p className="text-sm text-gray-500 mb-3">Full access to all features</p>
              <a 
                href={monthlyLink}
                className="block w-full"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                  Select Monthly
                </button>
              </a>
            </div>
            
            {/* Yearly plan option */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg">Annual Plan</h3>
              <p className="text-gray-600 mb-2">$184.72 per year <span className="text-green-600">(30% savings)</span></p>
              <p className="text-sm text-gray-500 mb-3">All features + priority support</p>
              <a 
                href="https://buy.stripe.com/eVa6rr9kw6GD9e8aEE"
                className="block w-full"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                  Select Annual
                </button>
              </a>
            </div>
            
            {/* Free trial option using the monthly link that includes 21-day trial */}
            <a 
              href={freeTrialLink}
              className="block w-full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="border-2 border-blue-400 rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50">
                <h3 className="font-semibold text-lg">14-Day Free Trial</h3>
                <p className="text-gray-600 mb-2">Try all features free for 14 days</p>
                <p className="text-sm text-gray-500 mb-3">Then $21.99/month</p>
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors">
                  Start Free Trial
                </button>
              </div>
            </a>
          </div>
          
          <div className="mt-6 pt-4 border-t text-center">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              I'll choose later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsModal;
