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
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import LearnPage from "./pages/learn";
import BlogPostPage from "./pages/learn/[slug]";

// Lazy load admin components
const AdminDashboard = React.lazy(() => import("@/pages/admin"));
const AdminBlog = React.lazy(() => import("@/pages/admin/blog"));

function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch('/api/user');
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch user');
      }
      return res.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  return { user, isLoading, error };
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

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
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Public routes that don't require authentication
  const publicPaths = ['/terms', '/privacy', '/about', '/learn'];
  const isPublicPath = publicPaths.some(path => 
    window.location.pathname === path || 
    window.location.pathname.startsWith('/learn/')
  );

  // If not authenticated and not on a public path, show auth page
  if (!user && !isPublicPath) {
    return <AuthPage />;
  }

  return (
    <Switch>
      <Route path="/about" component={AboutPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/health-stats" component={HealthStatsPage} />
      <Route path="/supplement-history" component={SupplementHistory} />
      <Route path="/" component={Dashboard} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/learn" component={LearnPage} />
      <Route path="/learn/:slug" component={BlogPostPage} />

      {/* Admin Routes */}
      <Route path="/admin" component={() => (
        <AdminRoute component={() => (
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <AdminDashboard />
          </Suspense>
        )} />
      )} />

      <Route path="/admin/supplements" component={(props) => (
        <AdminRoute component={AdminSupplements} {...props} />
      )} />

      <Route path="/admin/blog" component={() => (
        <AdminRoute component={() => (
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <AdminBlog />
          </Suspense>
        )} />
      )} />

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