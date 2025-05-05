
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentOptionsModal({ isOpen, onClose }: PaymentOptionsModalProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinueFree = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/set-tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: 'free' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to set free tier');
      }
      
      onClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error setting free tier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: 'core' | 'pro') => {
    try {
      setLoading(true);
      const priceId = tier === 'core' 
        ? process.env.STRIPE_CORE_MONTHLY_PRICE_ID 
        : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
        
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Choose Your Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center text-sm text-gray-500 mb-4">
            Select a plan that fits your needs
          </div>
          
          <div className="space-y-3">
            {/* Pro tier */}
            <Button
              onClick={() => handleSubscribe('pro')}
              className="w-full bg-green-700 hover:bg-green-800"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pro - Biohacker Suite ($14.99/mo)'}
            </Button>
            <div className="text-xs text-gray-500 pl-2 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" /> Full AI features
              <CheckCircle className="h-3 w-3 mx-1" /> Lab results analysis
              <CheckCircle className="h-3 w-3 mx-1" /> Advanced analytics
            </div>
            
            {/* Core tier */}
            <Button
              onClick={() => handleSubscribe('core')}
              className="w-full"
              variant="outline"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Core - AI Essentials ($7.99/mo)'}
            </Button>
            <div className="text-xs text-gray-500 pl-2 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" /> Basic AI features
              <CheckCircle className="h-3 w-3 mx-1" /> Enhanced tracking
            </div>
            
            {/* Free tier */}
            <Button 
              onClick={handleContinueFree}
              className="w-full"
              variant="ghost"
              disabled={loading}
            >
              Continue with Basic Tracking
            </Button>
            <div className="text-xs text-gray-500 pl-2 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" /> Basic supplement tracking
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
