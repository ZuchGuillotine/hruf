
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import PaymentOptionsModal from './PaymentOptionsModal';

type FormValues = {
  username: string;
  email: string;
  password: string;
};

const SignupForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  const handleClosePaymentModal = () => {
    setShowPaymentOptions(false);
    // Redirect to dashboard if they've already registered
    if (registeredUser) {
      window.location.href = '/dashboard';
    }
  };

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('Submitting registration data:', {
        email: data.email,
        username: data.username
      });

      // Call your signup API endpoint
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include' // Important for cookies/session
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Signup failed');
      }

      console.log('Registration successful:', responseData);
      setRegisteredUser(responseData.user);
      
      // Show payment options after successful signup
      // Important: This must execute before any redirects
      setShowPaymentOptions(true);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow-md max-w-md w-full mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="username" className="block mb-1 font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full p-2 border rounded"
              {...register('username', { required: 'Username is required' })}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1 font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full p-2 border rounded"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-1 font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-2 border rounded"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200"
            disabled={isLoading}
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
      </div>

      <PaymentOptionsModal 
        isOpen={showPaymentOptions} 
        onClose={handleClosePaymentModal} 
        monthlyLink="https://buy.stripe.com/6oEg2154g7KH7604gi"
        freeTrialLink="https://buy.stripe.com/eVa6rr9kw6GD9e8aEE"
      />
    </>
  );
};

export default SignupForm;
