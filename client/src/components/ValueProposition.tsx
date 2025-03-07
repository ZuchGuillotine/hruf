import { Card, CardContent } from "./ui/card";
import { Check } from "lucide-react";

export function ValueProposition() {
  const features = [
    {
      title: "Smart Supplement Tracking",
      description: "Track your supplements and their effects with our intelligent system"
    },
    {
      title: "AI-Powered Insights",
      description: "Get personalized recommendations based on your supplement stack"
    },
    {
      title: "Health Progress Analytics",
      description: "Visualize your health journey with detailed analytics and trends"
    },
    {
      title: "HIPAA Compliant",
      description: "Your health data is secure and protected"
    }
  ];

  return (
    <div className="py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#1b4332] mb-4">
          Optimize Your Supplement Stack
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Track, analyze, and optimize your supplement regimen with AI-powered insights
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {features.map((feature, index) => (
          <Card key={index} className="border-2 border-[#1b4332]/10 hover:border-[#1b4332]/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
