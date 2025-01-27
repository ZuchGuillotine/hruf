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
import { Loader2 } from "lucide-react";
import Footer from "@/components/footer";

type FormData = {
  email: string;
  password: string;
  username?: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
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
        await register(data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8]">
      <div className="flex-grow flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your account using your email or username"
                : "Create your account to get started"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
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
                {isLogin ? "Sign In" : "Create Account"}
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