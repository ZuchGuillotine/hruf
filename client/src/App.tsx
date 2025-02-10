import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AboutPage from "@/pages/about";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";
import HealthStatsPage from "@/pages/health-stats";
import SupplementHistory from "@/pages/supplement-history";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import AdminSupplements from "@/pages/admin/supplements";
import CookieConsent from "@/components/cookie-consent";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import LearnPage from "./pages/learn";
import BlogPostPage from "./pages/learn/[slug]";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Public routes that should be accessible without authentication
  const publicRoutes = (
    <Switch>
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/about" component={AboutPage} />
    </Switch>
  );

  // If user is not authenticated, show public routes or auth page
  if (!user) {
    return (
      <>
        {publicRoutes}
        <Route path="*" component={AuthPage} />
      </>
    );
  }

  // Protected routes for authenticated users
  return (
    <Switch>
      {publicRoutes}
      <Route path="/profile" component={ProfilePage} />
      <Route path="/health-stats" component={HealthStatsPage} />
      <Route path="/supplement-history" component={SupplementHistory} />
      <Route path="/" component={Dashboard} />
      <Route path="/admin" component={(props) => {
        const AdminDashboard = React.lazy(() => import("@/pages/admin"));
        return (
          <AdminRoute 
            component={() => (
              <React.Suspense fallback={<div>Loading...</div>}>
                <AdminDashboard />
              </React.Suspense>
            )} 
            {...props} 
          />
        );
      }} />
      <Route path="/admin/supplements" component={(props) => <AdminRoute component={AdminSupplements} {...props} />} />
      <Route path="/admin/blog" component={(props) => {
        const AdminBlog = React.lazy(() => import("@/pages/admin/blog"));
        return (
          <AdminRoute 
            component={() => (
              <React.Suspense fallback={<div>Loading...</div>}>
                <AdminBlog />
              </React.Suspense>
            )} 
            {...props} 
          />
        );
      }} />
      <Route path="/learn" component={LearnPage} />
      <Route path="/learn/:slug" component={BlogPostPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <CookieConsent />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;