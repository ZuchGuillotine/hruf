import React, { Suspense } from "react";
import { Router, Route, Switch } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import ErrorBoundary from "./components/ErrorBoundary"; // Added import

// Regular imports for main pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog/[slug]";
import HealthStats from "@/pages/health-stats";
import SupplementHistory from "@/pages/supplement-history";
import AdminSupplements from "@/pages/admin/supplements";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import VerifyEmail from "@/pages/verify-email";
import Ask from "@/pages/ask";

// Lazy loaded components with suspense
const Research = React.lazy(() => import("@/pages/research"));
const ResearchDocument = React.lazy(() => import("@/pages/research/[slug]"));
const AdminDashboard = React.lazy(() => import("@/pages/admin"));
const BlogEditor = React.lazy(() => import("@/pages/admin/blog/editor"));

// Protected route wrapper
const ProtectedRoute = ({ component: Component, ...rest }) => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
};

// Admin route wrapper
const AdminRoute = ({ component: Component, ...rest }) => {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>;
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <Component {...rest} />;
};

export function AppRouter() {
  return (
    <Router>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/ask" component={Ask} />

          {/* Protected routes */}
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/health-stats" component={HealthStats} />
          <ProtectedRoute path="/supplement-history/:date?" component={SupplementHistory} />

          {/* Research routes - with proper Suspense handling */}
          <Route path="/research">
            {(props) => (
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
                <Research {...props} />
              </Suspense>
            )}
          </Route>

          <Route path="/research/:slug">
            {(props) => (
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
                <ResearchDocument {...props} />
              </Suspense>
            )}
          </Route>

          {/* Admin routes */}
          <Route path="/admin">
            {(props) => (
              <AdminRoute
                component={(routeProps) => (
                  <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
                    <AdminDashboard {...routeProps} />
                  </Suspense>
                )}
                {...props}
              />
            )}
          </Route>

          <Route path="/admin/blog/create">
            {(props) => (
              <AdminRoute
                component={(routeProps) => (
                  <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
                    <BlogEditor {...routeProps} />
                  </Suspense>
                )}
                {...props}
              />
            )}
          </Route>

          <Route path="/admin/blog/edit/:id">
            {(props) => (
              <AdminRoute
                component={(routeProps) => (
                  <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
                    <BlogEditor {...routeProps} />
                  </Suspense>
                )}
                {...props}
              />
            )}
          </Route>

          <Route path="/admin/supplements" component={(props) => <AdminRoute component={AdminSupplements} {...props} />} />

          {/* 404 - Catch all route */}
          <Route>
            <div className="flex h-screen flex-col items-center justify-center">
              <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
              <p className="mt-4">The page you're looking for doesn't exist.</p>
              <a href="/" className="mt-4 text-blue-500 hover:underline">Go back home</a>
            </div>
          </Route>
        </Switch>
      </Suspense>
    </Router>
  );
}