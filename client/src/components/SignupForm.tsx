import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { PaymentOptionsModal } from './PaymentOptionsModal';
import { useNavigate } from 'react-router-dom';

interface SignupFormProps {
  onSignup?: (data: any) => void;
}

export function SignupForm({ onSignup }: SignupFormProps) {
  const { register, handleSubmit, formState: { errors }, setError } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Call your signup API endpoint
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include' // Important: this ensures cookies are sent with the request
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Signup failed');
      }

      const userData = await response.json();
      console.log('Signup successful:', userData);

      // After successful signup, explicitly log the user in
      try {
        const loginResponse = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password
          }),
          credentials: 'include' // Important: this ensures cookies are sent with the request
        });

        if (!loginResponse.ok) {
          console.warn('Auto-login after signup failed, continuing to payment options');
        } else {
          console.log('Auto-login after signup successful');
        }
      } catch (loginError) {
        console.warn('Auto-login error:', loginError);
        // Continue even if auto-login fails
      }

      // Show payment options after successful signup
      setShowPaymentOptions(true);

    } catch (error) {
      console.error('Signup error:', error);
      setError('form', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'An error occurred during signup'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentOptions(false);
    navigate('/dashboard');
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                placeholder="Email"
                {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })}
                className="w-full"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message?.toString()}</p>}
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
                className="w-full"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message?.toString()}</p>}
            </div>

            <div>
              <Input
                placeholder="Full Name"
                {...register('name', { required: 'Name is required' })}
                className="w-full"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message?.toString()}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PaymentOptionsModal 
        isOpen={showPaymentOptions} 
        onClose={handleClosePaymentModal} 
        monthlyLink="https://buy.stripe.com/6oEg2154g7KH7604gi"
        freeTrialLink="https://buy.stripe.com/6oEg2154g7KH7604gi"
      />
    </>
  );
}