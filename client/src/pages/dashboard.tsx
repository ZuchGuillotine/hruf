import Header from "@/components/header";
import SupplementList from "@/components/supplement-list";
import SupplementForm from "@/components/supplement-form";
import LLMChat from "@/components/llm-chat";
import { useState } from "react";
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
    <div className="min-h-screen bg-[#e8f3e8]"> {/* Light forest green background */}
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* AI Assistant Section */}
        <div className="bg-[#1b4332] rounded-lg p-6"> {/* Dark forest green box */}
          <h2 className="text-2xl font-semibold mb-4 text-white">AI Assistant</h2>
          <p className="text-white/90 mb-4">How are you feeling?</p>
          <div className="h-[300px]">
            <LLMChat />
          </div>
        </div>

        {/* Supplements Section */}
        <div className="bg-[#1b4332] rounded-lg p-6"> {/* Dark forest green box */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">My Supplements</h2>
            <Button
              onClick={() => setShowSupplementForm(true)}
              className="bg-white text-[#1b4332] hover:bg-white/90"
            >
              Add Supplement
            </Button>
          </div>
          <SupplementList />
        </div>
      </main>

      <Dialog open={showSupplementForm} onOpenChange={setShowSupplementForm}>
        <DialogContent className="bg-[#1b4332] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Supplement</DialogTitle>
          </DialogHeader>
          <SupplementForm onSuccess={() => setShowSupplementForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}