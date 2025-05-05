import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';

// Type for sign up form data
type SignupFormData = {
  email: string;
  username: string;
  password: string;
};

// This page is shown after successful Stripe checkout
export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, error, register: registerUser } = useUser();
  const [processingStatus, setProcessingStatus] = useState<'loading' | 'success' | 'error' | 'need-signup'>('loading');
  const [message, setMessage] = useState('Processing your subscription...');
  const [signupError, setSignupError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form for creating account after payment (for guest users)
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>();

  useEffect(() => {
    // Get session ID and purchase ID from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const purchaseId = urlParams.get('purchase_id');
    
    const verifyPayment = async () => {
      try {
        if (sessionId) {
          // Check if we have a purchaseId (meaning this was a guest checkout)
          // and the user is not logged in yet
          if (purchaseId && !user) {
            // This is a guest who has completed checkout and needs to create an account
            setProcessingStatus('need-signup');
            setMessage('Your payment was successful! Create an account to access your subscription.');
            return;
          }
          
          // For logged-in users, verify the subscription
          if (user) {
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
          }
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
  
  // Handle form submission for account creation after payment
  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsRegistering(true);
      setSignupError('');
      
      // Get the session ID from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const purchaseId = urlParams.get('purchase_id');
      
      if (!sessionId || !purchaseId) {
        throw new Error('Missing session information');
      }
      
      // Register the user
      const response = await registerUser({
        ...data,
        // Pass the session ID so the backend can link this user to the subscription
        stripeSessionId: sessionId,
        purchaseIdentifier: purchaseId
      });
      
      if (!response.ok) {
        throw new Error(response.message || 'Registration failed');
      }
      
      // Success! Show the confirmation screen
      setProcessingStatus('success');
      setMessage('Your account has been created and linked to your subscription!');
    } catch (error: any) {
      console.error('Registration error:', error);
      setSignupError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

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

          {processingStatus === 'need-signup' && (
            <>
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Payment Successful!</h2>
              <p className="text-center text-gray-700 mb-6">
                Create your account to access your subscription.
              </p>
              
              {signupError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm w-full">
                  {signupError}
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", { required: "Email is required" })}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs">{errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    {...register("username", { required: "Username is required" })}
                    placeholder="Choose a username"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs">{errors.username.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", { 
                      required: "Password is required",
                      minLength: { value: 6, message: "Password must be at least 6 characters" }
                    })}
                    placeholder="Create a password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs">{errors.password.message}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Complete Signup"
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}