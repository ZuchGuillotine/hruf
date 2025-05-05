import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useProfileCompletion } from '@/hooks/use-profile-completion';

export default function ProfileCompletionNotification() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const { completionPercentage, isLoading } = useProfileCompletion();

  if (!user || dismissed || completionPercentage === 100 || isLoading) {
    return null;
  }

  return (
    <Alert className="mb-4">
      <AlertTitle>Complete Your Profile</AlertTitle>
      <AlertDescription className="mt-2">
        <p>Please complete your profile to get personalized recommendations.</p>
        <Button 
          className="mt-2"
          onClick={() => setLocation('/profile')}
          variant="outline"
        >
          Complete Profile
        </Button>
        <Button
          className="mt-2 ml-2"
          onClick={() => setDismissed(true)}
          variant="ghost"
        >
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}