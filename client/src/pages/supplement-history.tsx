import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupplementHistory() {
  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8]">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6 flex-grow">
        <div className="bg-[#1b4332] rounded-lg p-6">
          <h2 className="text-3xl font-bold text-white mb-6">Supplement History</h2>
          <Card className="bg-white/10 border-none text-white">
            <CardHeader>
              <CardTitle>Your Supplement Intake History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">
                Track your supplement intake patterns and consistency over time.
                Detailed history view coming soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
