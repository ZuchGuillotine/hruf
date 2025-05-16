import React from 'react';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { Button } from './button';
import { useNavigate } from 'react-router-dom';

interface LimitReachedNotificationProps {
  message: string;
}

export function LimitReachedNotification({ message }: LimitReachedNotificationProps) {
  const navigate = useNavigate();

  return (
    <Alert variant="warning" className="mb-4">
      <AlertTitle>Usage Limit Reached</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        <Button
          onClick={() => navigate('/subscription-page')}
          variant="outline"
          className="mt-2"
        >
          Upgrade Plan
        </Button>
      </AlertDescription>
    </Alert>
  );
}