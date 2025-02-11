import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import Footer from "@/components/footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import LandingHeader from "@/components/landing-header";
import BackgroundWords from "@/components/background-words";

type FormData = {
  email: string;
  password: string;
  username?: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('login');
  });
  const [verificationSent, setVerificationSent] = useState(false);
  const { login, register } = useUser();
  const { toast } = useToast();

  const form = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (isLogin) {
        await login(data);
      } else {
        const response = await register(data);
        if (response.status === 'verification_required') {
          setVerificationSent(true);
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);

      let errorMessage = isLogin 
        ? "Login failed. Please check your credentials."
        : "Registration failed. Please try again.";

      if (error.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: isLogin ? "Login Error" : "Registration Error",
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to the backend's Google authentication route
    window.location.href = '/auth/google';
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex flex-col bg-[#e8f3e8]">
        <LandingHeader />
        <div className="flex-grow flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We've sent a verification link to your email address. Please click the link to verify your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  The verification link will expire in 24 hours. If you don't see the email in your inbox, please check your spam folder.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setVerificationSent(false);
                  setIsLogin(true);
                }}
              >
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8] relative">
      <LandingHeader />
      <BackgroundWords />
      <div className="flex-grow flex items-center justify-center px-4 relative z-10">
        <Card className="auth-card w-full max-w-[380px]">
          <CardHeader className="text-center">
            <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your account using your email or username"
                : "Join StackTracker to improve your supplementation protocol"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-3">
              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="auth-username"
                    name="username"
                    type="text"
                    {...form.register("username")}
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="auth-email" className="text-sm font-medium">
                  {isLogin ? "Email or Username" : "Email"}
                </label>
                <Input
                  id="auth-email"
                  name="email"
                  type={isLogin ? "text" : "email"}
                  {...form.register("email")}
                  placeholder={isLogin ? "Enter your email or username" : "Enter your email"}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="auth-password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="auth-password"
                  name="password" 
                  type="password"
                  {...form.register("password")}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/auth/google'}
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Continue with Google
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLogin ? "Sign In" : "Sign Up"}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
}