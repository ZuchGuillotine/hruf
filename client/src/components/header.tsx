import { useUser } from '@/hooks/use-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, LineChart, Database, Home, BookOpen, Info, History, HelpCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function Header() {
  const { user, logout } = useUser();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return user?.username?.slice(0, 2)?.toUpperCase() || '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer">
                StackTracker
              </h1>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/">
                  <div className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/learn">
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Blog</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/ask">
                  <div className="flex items-center cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Ask</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/research">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Research</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/about">
                  <div className="flex items-center">
                    <Info className="mr-2 h-4 w-4" />
                    <span>About</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || user?.username}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/health-stats">
                <div className="flex items-center">
                  <LineChart className="mr-2 h-4 w-4" />
                  <span>Health Stats</span>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/supplement-history">
                <div className="flex items-center">
                  <History className="mr-2 h-4 w-4" />
                  <span>Supplement History</span>
                </div>
              </Link>
            </DropdownMenuItem>
            {user?.isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <div className="flex items-center">
                      <Database className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}