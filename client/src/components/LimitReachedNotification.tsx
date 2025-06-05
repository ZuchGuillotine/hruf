/**
 * @description      :
 * @author           :
 * @group            :
 * @created          : 05/06/2025 - 09:54:36
 *
 * MODIFICATION LOG
 * - Version         : 1.0.0
 * - Date            : 05/06/2025
 * - Author          :
 * - Modification    :
 **/
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface LimitReachedNotificationProps {
  /**
   * When true, the alert is rendered. Pass the value returned by your plan-checking logic.
   */
  isUploadLimitReached: boolean;
}

/**
 * Renders an informational alert when the current user has reached their plan's
 * upload limit. Use this component inside the part of the UI where users
 * attempt to upload labs so that it appears in context.
 */
const LimitReachedNotification: React.FC<LimitReachedNotificationProps> = ({
  isUploadLimitReached,
}) => {
  if (!isUploadLimitReached) {
    return null;
  }

  return (
    <Alert className="mb-6">
      <InfoIcon className="h-4 w-4" />
      <div>
        <AlertTitle className="font-semibold">Upload Limit Reached</AlertTitle>
        <AlertDescription>
          You have reached your lab analysis upload limit. To continue, please upgrade your plan.
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default LimitReachedNotification;
