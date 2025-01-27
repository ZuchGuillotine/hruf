import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8]">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#1b4332]">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-green max-w-none">
            {/* Content will be added here */}
            <p>Terms of Service content will be placed here.</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
