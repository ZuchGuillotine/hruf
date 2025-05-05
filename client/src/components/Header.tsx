import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

const Header: React.FC = () => {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="border-b py-4">
      <div className="container flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <span className="font-bold text-xl">StackTracker</span>
          </a>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <a className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </a>
          </Link>
          <Link href="/pricing">
            <a className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
          </Link>
          {user ? (
            <>
              <Link href="/dashboard">
                <a className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </a>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth?mode=login">
                <a className="text-sm font-medium hover:text-primary transition-colors">
                  Login
                </a>
              </Link>
              <Link href="/auth?mode=register">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>

        <div className="md:hidden flex items-center">
          {/* Mobile menu button would go here */}
          <Button variant="ghost" size="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;