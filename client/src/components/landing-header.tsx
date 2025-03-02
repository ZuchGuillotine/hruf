import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Home, BookOpen, Info, HelpCircle, FileText, Search } from "lucide-react";

export default function LandingHeader() {
  const { user } = useUser();

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
            <DropdownMenuContent>
              {user ? (
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <div className="flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/signup">
                    <div className="flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Sign Up</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/blog">
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Blog</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ask">
                  <div className="flex items-center">
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
        <nav className="flex items-center space-x-6">
          <Link href="/about">
            <span className="text-foreground/60 hover:text-foreground transition-colors cursor-pointer">
              About
            </span>
          </Link>
          <Link href="/learn">
            <span className="text-foreground/60 hover:text-foreground transition-colors cursor-pointer">
              Blog
            </span>
          </Link>
          <Link href="/ask">
            <span className="text-foreground/60 hover:text-foreground transition-colors cursor-pointer">
              Ask
            </span>
          </Link>
          {!user && (
            <Button variant="ghost" asChild>
              <a href="/?login=true" className="text-foreground hover:text-foreground/80 transition-colors">
                Log in
              </a>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}