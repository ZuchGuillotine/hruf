import { Link } from 'wouter';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-8 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="font-bold">StackTracker</h3>
            <p className="text-sm text-muted-foreground">
              Track, analyze, and optimize your supplements for better health outcomes.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/subscription">
                  <span className="text-sm text-muted-foreground hover:text-foreground">
                    Pricing
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <span className="text-sm text-muted-foreground hover:text-foreground">
                    About
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/ask">
                  <span className="text-sm text-muted-foreground hover:text-foreground">
                    Ask AI
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/learn">
                  <span className="text-sm text-muted-foreground hover:text-foreground">
                    Blog
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/research">
                  <span className="text-sm text-muted-foreground hover:text-foreground">
                    Research
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms-of-service">
                  <span className="text-sm text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <span className="text-sm text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
          <p>&copy; {currentYear} StackTracker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}