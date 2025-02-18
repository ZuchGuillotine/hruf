import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"; // Assuming this import is needed
import { Home } from "lucide-react"; // Assuming this import is needed


export default function LandingHeader() {
  const { user } = useUser();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer">
              StackTracker
            </h1>
          </a>
        </div>
        <nav className="flex items-center space-x-6">
          <a href="/about" className="text-foreground/60 hover:text-foreground transition-colors">
            About
          </a>
          <a href="/learn" className="text-foreground/60 hover:text-foreground transition-colors">
            Learn
          </a>
          {!user && (
            <Button variant="ghost" asChild>
              <a href="/?login=true" className="text-foreground hover:text-foreground/80 transition-colors">
                Log in
              </a>
            </Button>
          )}
          <DropdownMenu>
            {user ? (
              <Link href="/">
                <DropdownMenuItem className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
              </Link>
            ) : (
              <Link href="/signup"> {/* Changed to /signup for signup page */}
                <DropdownMenuItem className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Sign Up</span>
                </DropdownMenuItem>
              </Link>
            )}
             {/* Added other potential dropdown items */}
            <DropdownMenuItem>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              Settings
            </DropdownMenuItem>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}