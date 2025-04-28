import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useProfileCompletion } from "@/hooks/use-profile-completion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ProfileCompletionNotification() {
  const [dismissed, setDismissed] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { completionPercentage, isLoading } = useProfileCompletion();
  const [, setLocation] = useLocation();

  // Use an effect to delay showing the notification until we're sure all data is loaded
  useEffect(() => {
    if (!isLoading && completionPercentage !== 100 && !dismissed) {
      // Add a slight delay to ensure all authentication and profile data is loaded
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setShowDialog(false);
    }
  }, [isLoading, completionPercentage, dismissed]);

  // Don't render anything during loading or if the profile is complete or dismissed
  if (isLoading || completionPercentage === 100 || dismissed || !showDialog) {
    return null;
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="bg-cyan-50 border-cyan-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-cyan-900">Complete Your Profile</AlertDialogTitle>
          <AlertDialogDescription className="text-cyan-800">
            Take a moment to complete your profile to get the most out of Stack Tracker. You're currently at {completionPercentage}% complete. Adding your lab results helps us provide more personalized insights.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => setDismissed(true)}
            className="text-cyan-700 hover:text-cyan-800 hover:bg-cyan-100"
          >
            Skip for now
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => setLocation("/profile")}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Complete Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}