import React from 'react';
import { Link } from 'wouter';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`border-t py-6 md:py-8 ${className}`}>
      <div className="container flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <span className="font-bold text-lg">StackTracker</span>
            </a>
          </Link>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} StackTracker. All rights reserved.
          </p>
        </div>
        <div className="flex space-x-4 text-sm">
          <Link href="/privacy">
            <a className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
          </Link>
          <Link href="/terms">
            <a className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
          </Link>
          <Link href="/contact">
            <a className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;