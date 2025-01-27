import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#1b4332] text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <span className="text-lg font-semibold">SupplementTracker</span>
          </div>
          <nav className="flex space-x-6">
            <Link href="/terms">
              <a className="text-white/80 hover:text-white transition-colors">
                Terms of Service
              </a>
            </Link>
            <Link href="/privacy">
              <a className="text-white/80 hover:text-white transition-colors">
                Privacy Policy
              </a>
            </Link>
            <Link href="/contact">
              <a className="text-white/80 hover:text-white transition-colors">
                Contact
              </a>
            </Link>
          </nav>
        </div>
        <div className="mt-6 text-center text-white/60 text-sm">
          © {new Date().getFullYear()} SupplementTracker. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
