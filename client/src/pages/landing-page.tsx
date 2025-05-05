import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ArrowRight, Shield, Zap, BarChart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Subscription plan data
const plans = [
  {
    id: "free",
    name: "Free",
    price: {
      monthly: 0,
      annual: 0,
    },
    description: "Basic access to health tracking and wellness tools",
    features: [
      { name: "Basic supplement tracking", included: true },
      { name: "AI health query assistant (5/day)", included: true },
      { name: "Manual health data logging", included: true },
      { name: "View basic health insights", included: true },
      { name: "Lab upload and analysis", included: false },
      { name: "Advanced supplement recommendations", included: false },
      { name: "Unlimited AI health queries", included: false },
      { name: "Advanced health data analytics", included: false },
      { name: "Priority support", included: false },
    ],
    badge: "",
    popular: false,
  },
  {
    id: "monthly",
    name: "Premium Monthly",
    price: {
      monthly: 21.99,
      annual: 0,
    },
    description: "Full access to all health tracking features and AI assistance",
    features: [
      { name: "Advanced supplement tracking", included: true },
      { name: "Unlimited AI health queries", included: true },
      { name: "Enhanced health data logging", included: true },
      { name: "Detailed health analytics", included: true },
      { name: "Lab upload and analysis", included: true },
      { name: "Personalized supplement recommendations", included: true },
      { name: "Health pattern recognition", included: true },
      { name: "Advanced health data analytics", included: true },
      { name: "Priority support", included: true },
    ],
    badge: "Most Popular",
    popular: true,
  },
  {
    id: "annual",
    name: "Premium Annual",
    price: {
      monthly: 0,
      annual: 184.71,
    },
    description: "Save 30% with our annual plan",
    features: [
      { name: "Advanced supplement tracking", included: true },
      { name: "Unlimited AI health queries", included: true },
      { name: "Enhanced health data logging", included: true },
      { name: "Detailed health analytics", included: true },
      { name: "Lab upload and analysis", included: true },
      { name: "Personalized supplement recommendations", included: true },
      { name: "Health pattern recognition", included: true },
      { name: "Advanced health data analytics", included: true },
      { name: "Priority support", included: true },
    ],
    badge: "Best Value",
    popular: false,
  },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedBillingCycle, setSelectedBillingCycle] = React.useState<"monthly" | "annual">("monthly");
  const [isRedirecting, setIsRedirecting] = React.useState<boolean>(false);

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Handle Stripe checkout for paid plans
  const handleCheckout = async (planId: string) => {
    if (isRedirecting) return;

    setIsRedirecting(true);
    try {
      // For free tier, redirect to sign-up page directly
      if (planId === "free") {
        navigate("/auth?plan=free");
        return;
      }

      // For paid tiers, initiate Stripe checkout
      const isAnnual = planId === "annual";
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        planId,
        isAnnual,
      });

      const { url } = await response.json();

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Track Your Health Journey with StackTracker
                </h1>
                <p className="text-muted-foreground md:text-xl">
                  The all-in-one platform for tracking supplements, monitoring health metrics, and 
                  receiving AI-powered insights to optimize your wellness.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  size="lg"
                  className="inline-flex h-10 items-center justify-center"
                  onClick={() => handleCheckout("free")}
                  disabled={isRedirecting}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="inline-flex h-10 items-center justify-center"
                  onClick={() => navigate("/auth")}
                  disabled={isRedirecting}
                >
                  Sign In
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="flex flex-col items-center space-y-2 rounded-lg border bg-muted/50 p-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-center font-medium">HIPAA Compliant</h3>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border bg-muted/50 p-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-center font-medium">AI Powered</h3>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border bg-muted/50 p-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-center font-medium">Data Analytics</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full py-12 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Choose Your Plan
              </h2>
              <p className="text-muted-foreground">
                Simple, transparent pricing for everyone. No hidden fees.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={selectedBillingCycle === "monthly" ? "default" : "outline"}
                onClick={() => setSelectedBillingCycle("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant={selectedBillingCycle === "annual" ? "default" : "outline"}
                onClick={() => setSelectedBillingCycle("annual")}
              >
                Annual
                <span className="ml-1.5 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary-foreground">
                  Save 30%
                </span>
              </Button>
            </div>
          </div>
          <div className="grid gap-6 mt-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg' : ''}`}
              >
                <CardHeader>
                  {plan.badge && (
                    <div className="py-1 px-2 text-xs font-medium bg-primary/10 text-primary inline-block rounded-full mb-2 self-start">
                      {plan.badge}
                    </div>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      ${selectedBillingCycle === "monthly" 
                          ? plan.price.monthly.toFixed(2) 
                          : plan.price.annual.toFixed(2)}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-muted-foreground ml-1">
                        /{selectedBillingCycle === "monthly" ? "month" : "year"}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        {feature.included ? (
                          <Check className="h-4 w-4 mr-2 text-primary" />
                        ) : (
                          <X className="h-4 w-4 mr-2 text-muted-foreground" />
                        )}
                        <span className={!feature.included ? "text-muted-foreground" : ""}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleCheckout(plan.id)}
                    disabled={isRedirecting || (plan.id === "annual" && selectedBillingCycle === "monthly") || (plan.id === "monthly" && selectedBillingCycle === "annual")}
                  >
                    {plan.id === "free" ? "Sign Up" : "Subscribe"}
                    {isRedirecting && (
                      <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Features Designed for Your Health Journey
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Comprehensive tools to track, analyze, and optimize your health and wellness routine.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Supplement Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Track your supplements, dosages, and schedules with ease. Set reminders and never miss a dose.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Receive personalized recommendations and insights based on your health data and supplement regimen.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lab Result Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Upload and track your lab results over time. Get AI-assisted interpretations and trend analysis.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Monitor vital health metrics including sleep, exercise, and nutrition to get a holistic view of your health.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Smart Journaling</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Log your health experiences with our guided journaling system for better self-monitoring and reflection.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Research-Based Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Access a curated library of health research and evidence-based recommendations for your supplements.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="w-full py-6 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">StackTracker</h3>
              <ul className="space-y-1">
                <li>
                  <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
                    Learn
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Legal</h3>
              <ul className="space-y-1">
                <li>
                  <a href="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-lg font-medium">Subscribe to our newsletter</h3>
              <p className="text-muted-foreground">
                Get the latest updates and health tips in your inbox.
              </p>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button>Subscribe</Button>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t pt-6">
            <p className="text-center text-muted-foreground text-sm">
              © {new Date().getFullYear()} StackTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}