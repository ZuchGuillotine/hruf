import { Link } from 'wouter';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <span className="font-bold text-xl">StackTracker</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/about">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground">
                About
              </span>
            </Link>
            <Link href="/research">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Research
              </span>
            </Link>
            <Link href="/learn">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Learn
              </span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="outline">Log in</Button>
              </Link>
              <Link href="/subscription">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}