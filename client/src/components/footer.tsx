import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#1b4332] text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <span className="text-lg font-semibold">StackTracker</span>
          </div>
          <nav className="flex space-x-6">
            <Link href="/terms-of-service">
              <a className="text-white/80 hover:text-white transition-colors cursor-pointer">
                Terms of Service
              </a>
            </Link>
            <Link href="/privacy-policy">
              <a className="text-white/80 hover:text-white transition-colors cursor-pointer">
                Privacy Policy
              </a>
            </Link>
            <Link href="/contact">
              <span className="text-white/80 hover:text-white transition-colors cursor-pointer">
                Contact
              </span>
            </Link>
          </nav>
        </div>
        <div className="mt-6 text-center text-white/60 text-sm">
          © {new Date().getFullYear()} StackTracker. All rights reserved.
        </div>
      </div>
    </footer>
  );
}