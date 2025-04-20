
import { useNavigate } from "wouter";
import { useState } from "react";
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
  const { completionPercentage } = useProfileCompletion();
  const navigate = useNavigate();

  if (completionPercentage === 100 || dismissed) {
    return null;
  }

  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent className="bg-orange-50 border-orange-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-orange-900">Complete Your Profile</AlertDialogTitle>
          <AlertDialogDescription className="text-orange-800">
            Take a moment to complete your profile to get the most out of Stack Tracker.
            This will help us provide more personalized recommendations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => setDismissed(true)}
            className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
          >
            Skip for now
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => navigate("/profile")}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Complete Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
