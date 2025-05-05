import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function Header() {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <a className="text-xl font-bold flex items-center gap-2">
              <span className="text-primary">StackTracker</span>
            </a>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Dashboard
                </a>
              </Link>
              <Link href="/profile">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  <User className="h-4 w-4 inline mr-1" />
                  {user.username}
                </a>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                disabled={logoutMutation.isLoading}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth?login=true">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Login
                </a>
              </Link>
              <Link href="/auth">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}