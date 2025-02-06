import { Link } from "wouter";

export default function LandingHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer">
              StackTracker
            </h1>
          </Link>
        </div>
        <nav className="flex items-center space-x-6">
          <Link href="/about">
            <a className="text-foreground/60 hover:text-foreground transition-colors">
              About
            </a>
          </Link>
          <Link href="/learn">
            <a className="text-foreground/60 hover:text-foreground transition-colors">
              Learn
            </a>
          </Link>
        </nav>
      </div>
    </header>
  );
}
