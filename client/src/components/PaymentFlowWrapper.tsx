
import * as React from 'react';
import { useEffect, useState } from 'react';
import PaymentOptionsModal from './PaymentOptionsModal';

/**
 * Wrapper component that checks if the payment modal should be shown
 * and displays it appropriately. This ensures new users see payment options
 * regardless of which authentication method they used.
 */
export default function PaymentFlowWrapper({ children }: { children: React.ReactNode }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkingPaymentFlow, setCheckingPaymentFlow] = useState(true);

  // Check on mount if payment modal should be shown
  useEffect(() => {
    const checkPaymentFlow = async () => {
      try {
        console.log('Checking payment flow status');
        
        // Check if we have a flag in local storage
        const localPaymentFlag = sessionStorage.getItem('showPaymentModal');
        
        if (localPaymentFlag === 'true') {
          console.log('Payment modal flag found in session storage');
          setShowPaymentModal(true);
          sessionStorage.removeItem('showPaymentModal');
          setCheckingPaymentFlow(false);
          return;
        }
        
        // If URL contains showPayment=true, show the modal
        if (window.location.search.includes('showPayment=true')) {
          console.log('Payment modal flag found in URL');
          setShowPaymentModal(true);
          // Remove the parameter from URL to avoid showing modal on refresh
          const url = new URL(window.location.href);
          url.searchParams.delete('showPayment');
          window.history.replaceState({}, document.title, url.pathname);
          setCheckingPaymentFlow(false);
          return;
        }
        
        // Check with the server if payment modal should be shown
        const response = await fetch('/api/payment-flow/check');
        const data = await response.json();
        
        console.log('Payment flow check response:', data);
        
        if (data.showPaymentModal) {
          setShowPaymentModal(true);
        }
        
        setCheckingPaymentFlow(false);
      } catch (error) {
        console.error('Error checking payment flow:', error);
        setCheckingPaymentFlow(false);
      }
    };
    
    checkPaymentFlow();
  }, []);

  const handleClosePaymentModal = () => {
    console.log('Closing payment modal');
    setShowPaymentModal(false);
  };

  return (
    <>
      {children}
      
      {/* The payment modal */}
      <PaymentOptionsModal 
        isOpen={showPaymentModal} 
        onClose={handleClosePaymentModal} 
        monthlyLink="https://buy.stripe.com/6oEg2154g7KH7604gi"
        freeTrialLink="https://buy.stripe.com/6oEg2154g7KH7604gi"
      />
      
      {/* Debug indicator - visible only during development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          right: 0, 
          background: showPaymentModal ? 'green' : 'red', 
          padding: '10px', 
          color: 'white',
          zIndex: 9999,
          fontWeight: 'bold',
          border: '2px solid black'
        }}>
          Payment Modal State: {showPaymentModal ? 'VISIBLE' : 'HIDDEN'}
          {checkingPaymentFlow && ' (Checking...)'}
        </div>
      )}
    </>
  );
}
