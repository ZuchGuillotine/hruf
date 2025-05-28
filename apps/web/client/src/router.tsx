
import React, { Suspense, lazy } from 'react';
import { Switch, Route } from 'wouter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Spinner } from '@/components/ui/spinner';

// Import components that need to be immediately available
import LandingPage from '@/pages/landing';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import VerifyEmailPage from '@/pages/verify-email';
import PrivacyPolicyPage from '@/pages/privacy-policy';
import TermsOfServicePage from '@/pages/terms-of-service';
import NotFoundPage from '@/pages/404';

// Lazily load components that aren't needed immediately
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const SupplementsPage = lazy(() => import('@/pages/supplements'));
const SupplementsDetailPage = lazy(() => import('@/pages/supplements/[id]'));
const SupplementListPage = lazy(() => import('@/pages/supplements/list'));
const DailyTrackerPage = lazy(() => import('@/pages/daily-tracker'));
const ChatPage = lazy(() => import('@/pages/chat'));
const ProfilePage = lazy(() => import('@/pages/profile'));
const HealthStatsPage = lazy(() => import('@/pages/health-stats'));
const BlogPage = lazy(() => import('@/pages/blog'));
const BlogPostPage = lazy(() => import('@/pages/blog/[slug]'));
const ResearchPage = lazy(() => import('@/pages/research'));
const ResearchDocumentPage = lazy(() => import('@/pages/research/[slug]'));
const QueryPage = lazy(() => import('@/pages/query'));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export function AppRouter() {
  return (
    <ErrorBoundary>
      <Switch>
        {/* Public routes that don't need lazy loading */}
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/terms-of-service" component={TermsOfServicePage} />
        
        {/* Protected routes with lazy loading and error boundaries */}
        <Route path="/dashboard">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <DashboardPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/supplements">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <SupplementsPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/supplements/:id">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <SupplementsDetailPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/supplements/list">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <SupplementListPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/daily-tracker">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <DailyTrackerPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/chat">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ChatPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/profile">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ProfilePage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/health-stats">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <HealthStatsPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/blog">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <BlogPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/blog/:slug">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <BlogPostPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/research">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ResearchPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/research/:slug">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ResearchDocumentPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        <Route path="/query">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <QueryPage />
            </Suspense>
          </ErrorBoundary>
        </Route>
        
        {/* 404 route */}
        <Route component={NotFoundPage} />
      </Switch>
    </ErrorBoundary>
  );
}
