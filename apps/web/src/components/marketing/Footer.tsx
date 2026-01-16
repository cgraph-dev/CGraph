/**
 * Marketing Footer Component
 * 
 * Shared footer for all marketing/public pages including
 * landing page, legal pages, and company pages.
 * 
 * @since v0.9.2
 */

import { Link } from 'react-router-dom';
import AnimatedLogo from '@/components/AnimatedLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Product */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/#features" className="text-gray-400 transition-colors hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#security" className="text-gray-400 transition-colors hover:text-white">
                  Security
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="text-gray-400 transition-colors hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 transition-colors hover:text-white">
                  Download
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://docs.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://docs.cgraph.org/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  API Reference
                </a>
              </li>
              <li>
                <Link to="/status" className="text-gray-400 transition-colors hover:text-white">
                  Status
                </Link>
              </li>
              <li>
                <a
                  href="https://blog.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-400 transition-colors hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-400 transition-colors hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-gray-400 transition-colors hover:text-white">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-400 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-400 transition-colors hover:text-white">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/gdpr" className="text-gray-400 transition-colors hover:text-white">
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <AnimatedLogo size="sm" />
            <span className="text-gray-400">© {currentYear} CGraph. All rights reserved.</span>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="/forum"
              className="text-gray-400 transition-colors hover:text-white"
              aria-label="Community Forum"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </a>
            <a
              href="https://twitter.com/cgraph_org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-colors hover:text-white"
              aria-label="Twitter"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
