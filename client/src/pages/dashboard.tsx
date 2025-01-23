import Header from "@/components/header";
import SupplementList from "@/components/supplement-list";
import SupplementForm from "@/components/supplement-form";
import LLMChat from "@/components/llm-chat";
import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const [showSupplementForm, setShowSupplementForm] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <ResizablePanelGroup direction="horizontal" className="min-h-[800px]">
          <ResizablePanel defaultSize={70}>
            <div className="h-full p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">My Supplements</h2>
                <Button
                  onClick={() => setShowSupplementForm(true)}
                  className="bg-primary text-primary-foreground"
                >
                  Add Supplement
                </Button>
              </div>
              <SupplementList />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={30}>
            <div className="h-full p-6">
              <h2 className="text-2xl font-semibold mb-4">AI Assistant</h2>
              <LLMChat />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <Dialog open={showSupplementForm} onOpenChange={setShowSupplementForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplement</DialogTitle>
          </DialogHeader>
          <SupplementForm onSuccess={() => setShowSupplementForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}