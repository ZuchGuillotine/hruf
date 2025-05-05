import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function ProfileCompletionNotification() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);

  const { data: profileCompletion } = useQuery({
    queryKey: ['profileCompletion', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/profile/completion', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile completion status');
      }
      return response.json();
    },
    enabled: !!user?.id
  });

  if (!user || dismissed || !profileCompletion?.needsCompletion) {
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