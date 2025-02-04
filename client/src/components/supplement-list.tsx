import { useSupplements } from "@/hooks/use-supplements";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Pencil, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SupplementForm from "./supplement-form";
import { useState } from "react";
import React from "react";

export default function SupplementList() {
  const { supplements, isLoading, deleteSupplement, updateSupplement } = useSupplements();
  const [editingSupplement, setEditingSupplement] = useState<number | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [supplementStates, setSupplementStates] = useState<Record<number, { taken: boolean }>>({});

  // Initialize supplement states
  React.useEffect(() => {
    const initialStates = supplements.reduce((acc, supplement) => {
      acc[supplement.id] = { taken: true }; // Default to taken
      return acc;
    }, {} as Record<number, { taken: boolean }>);
    setSupplementStates(initialStates);
  }, [supplements]);

  const handleSaveChanges = async () => {
    try {
      // Here we'll implement the save functionality
      // This will be connected to the backend to store the tracking data
      setShowSaveConfirmation(false);
      // TODO: Implement actual save logic
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (supplements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No supplements added yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {supplements.map((supplement) => (
          <Card key={supplement.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{supplement.name}</CardTitle>
                  <CardDescription>
                    {supplement.dosage} • {supplement.frequency}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingSupplement(supplement.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Supplement</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this supplement? This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSupplement(supplement.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {supplement.notes && <p className="text-sm mb-4">{supplement.notes}</p>}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Today</span>
                <Switch
                  checked={supplementStates[supplement.id]?.taken ?? true}
                  onCheckedChange={(checked) => {
                    setSupplementStates(prev => ({
                      ...prev,
                      [supplement.id]: { ...prev[supplement.id], taken: checked }
                    }));
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Button and Confirmation Dialog */}
      <div className="mt-6 flex justify-end">
        <AlertDialog open={showSaveConfirmation} onOpenChange={setShowSaveConfirmation}>
          <AlertDialogTrigger asChild>
            <Button className="bg-white text-[#1b4332] hover:bg-white/90">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save Changes</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to update your supplement tracking information? This will
                override your previous entries for today.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveChanges}>
                Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Edit Supplement Dialog */}
      <Dialog
        open={editingSupplement !== null}
        onOpenChange={(open) => !open && setEditingSupplement(null)}
      >
        <DialogContent className="bg-[#1b4332] text-white">
          <DialogHeader>
            <DialogTitle>Edit Supplement</DialogTitle>
          </DialogHeader>
          {editingSupplement && (
            <SupplementForm
              supplementId={editingSupplement}
              onSuccess={() => setEditingSupplement(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}