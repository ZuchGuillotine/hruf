import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { queryClient } from '@/lib/queryClient';

// This page is shown after successful Stripe checkout
export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, error } = useUser();
  const [processingStatus, setProcessingStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your subscription...');

  useEffect(() => {
    // Get session ID from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    const verifyPayment = async () => {
      try {
        if (sessionId) {
          // Call API to verify the payment
          const response = await fetch(`/api/stripe/subscription-success?session_id=${sessionId}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Payment verification failed');
          }
          
          // Refresh user data to get updated subscription status
          await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          
          setProcessingStatus('success');
          setMessage('Your subscription has been activated successfully!');
        } else {
          // If no session ID, just check if user has active subscription
          if (user?.isPro || (user?.subscriptionTier && user?.subscriptionTier !== 'free')) {
            setProcessingStatus('success');
            setMessage('Your subscription is active!');
          } else {
            throw new Error('No session ID found');
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setProcessingStatus('error');
        setMessage('There was an issue processing your payment. Please contact support if your subscription is not active.');
      }
    };

    // Wait until user data is loaded before verifying payment
    if (!isLoading) {
      verifyPayment();
    }
  }, [isLoading, user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center border-b pb-8">
          <CardTitle className="text-xl md:text-2xl text-green-800">
            Payment Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center">
          {processingStatus === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-green-600 animate-spin mb-4" />
              <p className="text-center text-gray-700">{message}</p>
            </>
          )}

          {processingStatus === 'success' && (
            <>
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Thank You!</h2>
              <p className="text-center text-gray-700 mb-6">{message}</p>
              
              <div className="w-full space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => setLocation('/')}
                >
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {processingStatus === 'error' && (
            <>
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <span className="h-10 w-10 text-red-600 flex items-center justify-center text-2xl">!</span>
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Oops!</h2>
              <p className="text-center text-gray-700 mb-6">{message}</p>
              
              <div className="w-full space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => setLocation('/subscription')}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setLocation('/')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}