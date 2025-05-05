import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

// Define the form schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be at most 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      name: '',
    },
  });

  useEffect(() => {
    // Extract the session_id from URL query params
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session_id');
    
    if (!session) {
      setError('No session ID found. Please try again or contact support.');
      setLoading(false);
      return;
    }
    
    setSessionId(session);
    
    // Fetch session details from Stripe
    const fetchSessionDetails = async () => {
      try {
        const response = await fetch(`/api/stripe/checkout-session/${session}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error('Failed to retrieve session details');
        }
        
        const data = await response.json();
        
        // Prefill email if available
        if (data.customer_details?.email) {
          form.setValue('email', data.customer_details.email);
        }
        
        setSessionDetails(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching session details:', err);
        setError('Unable to verify your payment. Please try again or contact support.');
        setLoading(false);
      }
    };
    
    fetchSessionDetails();
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    if (!sessionId) return;
    
    setRegistering(true);
    
    try {
      // Send registration data to the server
      const response = await fetch('/api/post-payment-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sessionId,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      // Show success message
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created and you are now logged in!',
      });
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('Registration error:', err);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: err.message || 'Failed to create your account. Please try again.',
      });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Verifying your payment...</h2>
            <p className="mt-2 text-muted-foreground">This will only take a moment.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-center text-xl">Payment Verification Failed</CardTitle>
              <CardDescription className="text-center">{error}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => setLocation('/')}>Return to Homepage</Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-xl">Payment Successful!</CardTitle>
            <CardDescription className="text-center">
              Complete your account setup to get started with StackTracker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="your.email@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Choose a username" />
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
                        <Input type="password" {...field} placeholder="Choose a secure password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registering}
                >
                  {registering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Creating Your Account...
                    </>
                  ) : (
                    "Complete Account Setup"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}