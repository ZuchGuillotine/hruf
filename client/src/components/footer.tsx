import { Link } from 'wouter';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-6 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-3">StackTracker</h3>
            <p className="text-sm text-gray-500">
              Optimize your supplements and health with AI-powered tracking and analysis.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Features</a>
                </Link>
              </li>
              <li>
                <Link href="/pricing">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Pricing</a>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <a className="text-sm text-gray-500 hover:text-gray-900">FAQ</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <a className="text-sm text-gray-500 hover:text-gray-900">About Us</a>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Blog</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Contact</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Terms of Service</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="text-sm text-gray-500 hover:text-gray-900">Privacy Policy</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>© {currentYear} StackTracker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}