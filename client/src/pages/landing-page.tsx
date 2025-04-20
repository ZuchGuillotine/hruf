import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, CalendarClock, ChevronRight } from "lucide-react";
import Footer from "@/components/footer";
import LandingHeader from "@/components/landing-header";
import BackgroundWords from "@/components/background-words";
import { ValueProposition } from "@/components/ValueProposition";
import { useLocation } from 'wouter';

type TrialFormData = {
  email: string;
  username: string;
  password: string;
};

export default function LandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { register: registerField, handleSubmit, formState: { errors } } = useForm<TrialFormData>();

  const onSubmit = async (data: TrialFormData) => {
    try {
      setIsSubmitting(true);
      
      // Register the user first
      const response = await register(data);
      
      if (!response.ok) {
        throw new Error(response.message);
      }
      
      // After successful registration, redirect to start free trial
      await fetch('/api/stripe/start-free-trial', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Redirect to dashboard after trial is started
      setLocation('/dashboard');
      
    } catch (error: any) {
      console.error('Free trial signup error:', error);
      
      let errorMessage = "Registration failed. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    setLocation('/auth?login=true');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8] relative">
      <LandingHeader />
      <BackgroundWords className="absolute inset-0 z-0" />

      <main className="flex-grow container mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-[#1b4332] mb-6">
            Optimize Your Supplement Stack
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Track, analyze, and optimize your supplement regimen with AI-powered insights
          </p>
          <Button 
            size="lg" 
            className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white"
            onClick={() => {
              const trialElement = document.getElementById('try-free');
              if (trialElement) {
                trialElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Start 14-Day Free Trial <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Value Proposition Section */}
        <div className="mb-20">
          <ValueProposition />
        </div>

        {/* Pricing Cards Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center text-[#1b4332] mb-12">Simple, Transparent Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Trial Card */}
            <Card className="shadow-lg border-2 border-[#2d6a4f] transform transition-transform hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Free Trial</CardTitle>
                <CardDescription>Try all features risk-free</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-4xl font-bold text-[#1b4332] mb-4">14 Days</p>
                <p className="text-sm text-gray-500 mb-6">No credit card required</p>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Full access to all features</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>AI-powered supplement analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Health tracking dashboard</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-[#2d6a4f] hover:bg-[#1b4332]" onClick={() => {
                  const signupElement = document.getElementById('free-trial-signup');
                  if (signupElement) {
                    signupElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Start Free Trial
                </Button>
              </CardFooter>
            </Card>
            
            {/* Monthly Subscription Card */}
            <Card className="shadow-lg transform transition-transform hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Monthly</CardTitle>
                <CardDescription>Flexible month-to-month plan</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-4xl font-bold text-[#1b4332] mb-4">$21.99</p>
                <p className="text-sm text-gray-500 mb-6">per month</p>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>All features included</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Cancel anytime</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setLocation('/subscription')}>
                  Select Plan
                </Button>
              </CardFooter>
            </Card>
            
            {/* Annual Subscription Card */}
            <Card className="shadow-lg border-2 border-[#2d6a4f] transform transition-transform hover:-translate-y-2">
              <CardHeader className="text-center pb-4 relative">
                <div className="absolute -top-4 left-0 right-0 mx-auto w-max px-4 py-1 bg-[#2d6a4f] text-white text-sm rounded-full">
                  Best Value
                </div>
                <CardTitle className="text-2xl">Annual</CardTitle>
                <CardDescription>Save 30% with yearly billing</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-4xl font-bold text-[#1b4332] mb-4">$184.71</p>
                <p className="text-sm text-gray-500 mb-6">per year (save $78.99)</p>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>All features included</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>VIP priority support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Lock in current pricing</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-[#2d6a4f] hover:bg-[#1b4332]" onClick={() => setLocation('/subscription')}>
                  Select Plan
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Free Trial Signup Form */}
        <div id="free-trial-signup" className="max-w-md mx-auto mb-16">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle id="try-free">Try StackTracker Free for 14 Days</CardTitle>
              <CardDescription>
                No credit card required. Get full access instantly.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...registerField("email", { required: true })}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs">Email is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    {...registerField("username", { required: true })}
                    placeholder="Choose a username"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs">Username is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    {...registerField("password", { required: true, minLength: 6 })}
                    placeholder="Create a password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs">Password must be at least 6 characters</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-[#2d6a4f] hover:bg-[#1b4332]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarClock className="mr-2 h-4 w-4" />
                  )}
                  Start Free Trial
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={goToLogin}
                >
                  Already have an account? Sign in
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      
      <Footer className="relative z-10" />
    </div>
  );
}