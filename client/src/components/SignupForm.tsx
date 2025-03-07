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

  const onSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      console.log('Beginning signup process with data:', { email: formData.email, username: formData.username });

      // Call your signup API endpoint
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include' // Important: include credentials for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Signup failed');
      }

      console.log('Signup successful, user data:', data);

      // Show payment options regardless of authentication state
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