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
    
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {features.map((feature, index) => (
        <Card key={index} className="border-2 border-[#1b4332]/10 hover:border-[#1b4332]/20 transition-colors shadow-lg relative z-50 bg-white/95 backdrop-blur-sm">
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
  );
}