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

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

type FormData = {
  email: string;
  password: string;
  username?: string;
};

type GoogleResponse = {
  credential: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('login') === 'true';
  });
  const [verificationSent, setVerificationSent] = useState(false);
  const { login, register, googleLogin } = useUser();
  const { toast } = useToast();

  const form = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  const handleGoogleResponse = async (response: GoogleResponse) => {
    try {
      await googleLogin(response.credential);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: "798510659255-vhb18ruokhvkbft5ddjo0pke399fhjgi.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });

      const buttonContainer = document.getElementById("google-signin");
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
        });
      }
    };

    setTimeout(initializeGoogle, 100);
  }, [googleLogin]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isLogin) {
        await login(data);
      } else {
        const response = await register(data);
        if (response.status === 'verification_required') { // Changed to check status
          setVerificationSent(true);
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Registration Error",
        description: errorMessage,
        duration: 5000,
      });
    }
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
            <CardTitle>{isLogin ? "Login" : "Signup"}</CardTitle>
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
                    id="username"
                    type="text"
                    {...form.register("username")}
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {isLogin ? "Email or Username" : "Email"}
                </label>
                <Input
                  id="email"
                  type={isLogin ? "text" : "email"}
                  {...form.register("email")}
                  placeholder={isLogin ? "Enter your email or username" : "Enter your email"}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
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

              <div id="google-signin" className="flex justify-center mt-4"></div>
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
                {isLogin ? "Sign In" : "Signup"}
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