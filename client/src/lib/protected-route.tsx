import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteComponentProps } from "wouter";

/**
 * ProtectedRoute Component
 * 
 * A wrapper for routes that require authentication.
 * If the user is not authenticated, they are redirected to the auth page.
 * 
 * @param path The route path
 * @param component The component to render if authenticated
 */
export function ProtectedRoute({
  path,
  component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        {() => <Redirect to="/auth" />}
      </Route>
    );
  }

  // Create a wrapper component to handle the component props correctly
  const WrappedComponent = (props: RouteComponentProps) => {
    const Component = component;
    return <Component {...props} />;
  };

  return <Route path={path} component={WrappedComponent} />;
}