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

      console.log("Registration response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error("Registration error:", data);
        setError(data.message || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Registration response:", data);

      // Update state for successful registration
      setSuccess("Account created successfully!");
      setIsLoading(false);
      
      // Show payment options modal with proper state handling
      console.log("Setting payment modal to visible");
      // Use a slightly longer timeout to ensure DOM updates complete
      setTimeout(() => {
        setShowPaymentOptions(true);
        console.log("Payment modal visibility state updated to:", true);
      }, 300);

      return; // Exit early since we've handled success
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  // Handle closing the payment modal
  const handleClosePaymentModal = () => {
    console.log("Closing payment modal");
    setShowPaymentOptions(false);
    
    // Use timeout to ensure state updates before redirect
    setTimeout(() => {
      console.log("Redirecting to dashboard after modal close");
      window.location.href = '/dashboard';
    }, 100);
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

      {/* Payment modal */}
      {console.log("Rendering PaymentOptionsModal, isOpen:", showPaymentOptions)}
      <PaymentOptionsModal 
        isOpen={showPaymentOptions} 
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
          background: showPaymentOptions ? 'green' : 'red', 
          padding: '10px', 
          color: 'white',
          zIndex: 9999,
          fontWeight: 'bold',
          border: '2px solid black'
        }}>
          Payment Modal State: {showPaymentOptions ? 'VISIBLE' : 'HIDDEN'}
        </div>
      )}
    </>
  );
}