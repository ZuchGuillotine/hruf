
import React from 'react';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyLink: string;
  yearlyLink?: string;
  freeTrialLink: string;
}

/**
 * Modal component that displays payment options
 */
const PaymentOptionsModal: React.FC<PaymentOptionsModalProps> = ({
  isOpen,
  onClose,
  monthlyLink,
  yearlyLink = "https://buy.stripe.com/14k3fJeRWakp8a8aEJ",
  freeTrialLink
}) => {
  if (!isOpen) return null;

  console.log('Displaying payment options modal with links:', { 
    monthlyLink, 
    yearlyLink, 
    freeTrialLink 
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Choose a Plan</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Monthly subscription option */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
            <a 
              href={monthlyLink}
              className="block w-full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">Monthly Subscription</h3>
                  <p className="text-sm text-gray-600">$21.99 per month</p>
                </div>
                <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                  Select
                </button>
              </div>
            </a>
          </div>
          
          {/* Yearly subscription option */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
            <a 
              href={yearlyLink}
              className="block w-full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">Yearly Subscription</h3>
                  <p className="text-sm text-gray-600">$184.72 per year (16% savings)</p>
                </div>
                <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                  Select
                </button>
              </div>
            </a>
          </div>
          
          {/* Free trial option using the monthly link that includes 21-day trial */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
            <a 
              href={freeTrialLink}
              className="block w-full"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">14-Day Free Trial</h3>
                  <p className="text-sm text-gray-600">Then $21.99 per month</p>
                </div>
                <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                  Start Free
                </button>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsModal;
