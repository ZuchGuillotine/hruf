import Header from "@/components/header";
import SupplementList from "@/components/supplement-list";
import SupplementForm from "@/components/supplement-form";
import LLMChat from "@/components/llm-chat";
import Footer from "@/components/footer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Scale, Moon } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const [showSupplementForm, setShowSupplementForm] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8]">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6 flex-grow">
        {/* AI Assistant Section */}
        <div className="bg-[#1b4332] rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Stack Chat Assistant</h2>
          <p className="text-white/90 mb-4">How are you feeling?</p>
          <div className="h-[300px]">
            <LLMChat />
          </div>
        </div>

        {/* Supplements Section */}
        <div className="bg-[#1b4332] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">Track my Supplements</h2>
            <Button
              onClick={() => setShowSupplementForm(true)}
              className="bg-white text-[#1b4332] hover:bg-white/90"
            >
              Add Supplement
            </Button>
          </div>
          <SupplementList />
        </div>

        {/* Health Statistics Overview */}
        <div className="bg-[#1b4332] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">Health Overview</h2>
            <Link href="/health-stats">
              <Button
                className="bg-white text-[#1b4332] hover:bg-white/90"
              >
                View Full Stats
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/10 border-none text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Weight Tracking</CardTitle>
                <Scale className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Update Stats</div>
                <p className="text-xs text-white/70">Track your weight progress</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sleep Analysis</CardTitle>
                <Moon className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Log Sleep</div>
                <p className="text-xs text-white/70">Monitor your sleep patterns</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Health Trends</CardTitle>
                <LineChart className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">View Trends</div>
                <p className="text-xs text-white/70">Analyze your health data</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

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