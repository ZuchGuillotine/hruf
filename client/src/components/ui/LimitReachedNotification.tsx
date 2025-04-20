import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface LimitReachedNotificationProps {
  onClose?: () => void;
}

/**
 * Notification component displayed when a user has reached their daily AI interaction limit
 */
export const LimitReachedNotification: React.FC<LimitReachedNotificationProps> = ({ onClose }) => {
  const [, setLocation] = useLocation();

  const handleGoToSubscription = () => {
    setLocation('/subscription');
    if (onClose) {
      onClose();
    }
  };

  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 mb-6">
      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-semibold ml-2">
        Daily Limit Reached
      </AlertTitle>
      <AlertDescription className="ml-7 text-yellow-700 dark:text-yellow-400">
        <p className="mb-3">
          You've reached your daily limit of 10 AI interactions. Upgrade to our Pro plan for unlimited access to all AI features.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            onClick={handleGoToSubscription}
          >
            Upgrade Now
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default LimitReachedNotification;