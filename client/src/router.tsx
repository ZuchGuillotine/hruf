import { Route, Router, Switch } from 'wouter';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/protected-route';
import { AdminRoute } from './components/admin-route';
import { Spinner } from '@/components/ui/spinner';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/home'));
const Login = lazy(() => import('./pages/login'));
const Register = lazy(() => import('./pages/register'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Blog = lazy(() => import('./pages/blog'));
const BlogPost = lazy(() => import('./pages/blog-post'));
const BlogEditor = lazy(() => import('./pages/admin/blog-editor'));
const AdminDashboard = lazy(() => import('./pages/admin/admin-dashboard'));
const AdminSupplements = lazy(() => import('./pages/admin/supplements'));
const HealthStats = lazy(() => import('./pages/health-stats'));
const SupplementHistory = lazy(() => import('./pages/supplement-history'));
const Research = lazy(() => import('./pages/research'));
const Ask = lazy(() => import('./pages/ask'));
const TermsOfService = lazy(() => import('./pages/terms-of-service'));
const PrivacyPolicy = lazy(() => import('./pages/privacy-policy'));
const VerifyEmail = lazy(() => import('./pages/verify-email'));

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
          <ProtectedRoute path="/research" component={Research} />

          {/* Admin routes */}
          <AdminRoute path="/admin" component={AdminDashboard} />
          <AdminRoute path="/admin/blog/create" component={BlogEditor} />
          <AdminRoute path="/admin/blog/edit/:id" component={BlogEditor} />
          <AdminRoute path="/admin/supplements" component={AdminSupplements} />

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