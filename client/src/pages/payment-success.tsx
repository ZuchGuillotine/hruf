import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  CreditCard, 
  CheckCircle2, 
  Loader2,
  User,
  Mail,
  Lock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { getTierFromPriceId } from '@/lib/stripe-price-ids';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type FormValues = z.infer<typeof formSchema>;

export default function PaymentSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Parse the URL query parameters
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Fetch session data on mount
  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (user) {
      setLocation('/');
      return;
    }

    // If no session ID, show error
    if (!sessionId) {
      setLoading(false);
      setError('Invalid session. Please try again or contact support.');
      return;
    }

    // Fetch session data from Stripe
    const fetchSessionData = async () => {
      try {
        const response = await fetch(`/api/stripe/checkout-session/${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to verify payment session');
        }
        
        const data = await response.json();
        
        // Verify the payment was successful
        if (data.payment_status !== 'paid') {
          throw new Error('Payment was not completed successfully');
        }
        
        setSessionData(data);
        
        // Pre-fill the email if available
        if (data.customer_details?.email) {
          form.setValue('email', data.customer_details.email);
        }
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError(err.message || 'Failed to verify payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, user, setLocation, form]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setRegistering(true);
    
    try {
      // Determine subscription tier from the price ID
      const priceId = sessionData?.line_items?.data[0]?.price?.id;
      const subscriptionTier = priceId ? getTierFromPriceId(priceId) : 'free';
      
      // Register the user
      const response = await fetch('/api/register-post-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          sessionId,
          subscriptionTier,
          purchaseId: sessionData?.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      toast({
        title: 'Account created successfully!',
        description: 'Welcome to StackTracker. You can now access all features.',
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        setLocation('/');
      }, 1000);
    } catch (err: any) {
      console.error('Registration error:', err);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-lg">Verifying your payment...</p>
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Payment Verification Failed</CardTitle>
                <CardDescription className="text-red-700">
                  We couldn't verify your payment session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{error}</p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setLocation('/')}>Return to Home</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                <h1 className="mt-4 text-3xl font-extrabold text-gray-900">Payment Successful!</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Thank you for your purchase. Please complete your account setup below.
                </p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Create Your Account</CardTitle>
                  <CardDescription>
                    Set up your account to access all StackTracker features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Enter your username" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="you@example.com" 
                                  type="email" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Create a password" 
                                  type="password" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Confirm your password" 
                                  type="password" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-6" 
                        disabled={registering}
                      >
                        {registering ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Complete Account Setup
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}