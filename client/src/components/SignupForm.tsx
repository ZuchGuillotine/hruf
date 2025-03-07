import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PaymentOptionsModal from './PaymentOptionsModal';

// Form schema with validation
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // Form definition using react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      console.log("Submitting signup form:", { email: values.email, username: values.username });

      // Register the user
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || data.error || 'Signup failed');
        setIsLoading(false);
        return;
      }

      // Registration successful
      const data = await response.json();
      console.log('Registration response:', data);

      // Verify authentication status before proceeding
      try {
        // Make an immediate auth check request to ensure session is established
        const authCheckResponse = await fetch('/api/debug/auth-status', {
          credentials: 'include'
        });

        const authStatus = await authCheckResponse.json();
        console.log('Auth status after registration:', authStatus);

        if (!authStatus.isAuthenticated) {
          console.log('Session not established yet, attempting to fetch user data');
          // Try to fetch user data to confirm registration
          const userResponse = await fetch('/api/user', {
            credentials: 'include'
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            // Update the authentication state (simulated here)
            setSuccess("Account created successfully!");
            setShowPaymentOptions(true);
          } else {
            // If we can't get user data, redirect to login with success message
            setSuccess("Account created. Please log in.");
            setIsLoading(false);
            window.location.href = '/login?registered=true';
            return;
          }
        } else {
          // Session is established, proceed normally
          setSuccess("Account created successfully!");
          setShowPaymentOptions(true);
        }
      } catch (authError) {
        console.error('Auth verification error:', authError);
        // Still try to use the data from registration
        if (data.user) {
          setSuccess("Account created successfully!");
          setShowPaymentOptions(true);
        } else {
          // Fallback to redirect
          setSuccess("Account created. Please log in.");
          setIsLoading(false);
          window.location.href = '/login?registered=true';
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  // Handle closing the payment modal
  const handleClosePaymentModal = () => {
    setShowPaymentOptions(false);
    // Redirect to dashboard or another page after closing
    window.location.href = '/dashboard';
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} />
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
                  <Input placeholder="username" {...field} />
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
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </Form>

      <PaymentOptionsModal 
        isOpen={showPaymentOptions} 
        onClose={handleClosePaymentModal} 
        monthlyLink="https://buy.stripe.com/6oEg2154g7KH7604gi"
        freeTrialLink="https://buy.stripe.com/6oEg2154g7KH7604gi"
      />
    </>
  );
}