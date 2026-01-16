/**
 * Marketing Navigation Component
 * 
 * Shared navigation bar for all marketing/public pages including
 * landing page, legal pages, and company pages.
 * 
 * @since v0.9.2
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedLogo from '@/components/AnimatedLogo';

interface NavigationProps {
  /** Whether to show landing page anchor links (Features, Security, Pricing) */
  showLandingLinks?: boolean;
  /** Whether to use transparent background initially (for hero sections) */
  transparent?: boolean;
}

export default function Navigation({ showLandingLinks = false, transparent = true }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const showBackground = scrolled || !transparent;

  return (
    <motion.nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        showBackground ? 'bg-gray-900/95 shadow-lg backdrop-blur-md' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <AnimatedLogo size="sm" />
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
              CGraph
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {showLandingLinks ? (
              <>
                <a href="#features" className="text-gray-300 transition-colors hover:text-white">
                  Features
                </a>
                <a href="#security" className="text-gray-300 transition-colors hover:text-white">
                  Security
                </a>
                <a href="#pricing" className="text-gray-300 transition-colors hover:text-white">
                  Pricing
                </a>
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-300 transition-colors hover:text-white">
                  Home
                </Link>
                <Link to="/about" className="text-gray-300 transition-colors hover:text-white">
                  About
                </Link>
              </>
            )}
            <a
              href="https://docs.cgraph.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 transition-colors hover:text-white"
            >
              Docs
            </a>
          </div>

          {/* Auth buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-300 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-2 font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="text-gray-300 hover:text-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-b-xl bg-gray-900/95 backdrop-blur-md md:hidden"
            >
              <div className="space-y-4 px-4 py-4">
                {showLandingLinks ? (
                  <>
                    <a
                      href="#features"
                      className="block text-gray-300 transition-colors hover:text-white"
                    >
                      Features
                    </a>
                    <a
                      href="#security"
                      className="block text-gray-300 transition-colors hover:text-white"
                    >
                      Security
                    </a>
                    <a
                      href="#pricing"
                      className="block text-gray-300 transition-colors hover:text-white"
                    >
                      Pricing
                    </a>
                  </>
                ) : (
                  <>
                    <Link
                      to="/"
                      className="block text-gray-300 transition-colors hover:text-white"
                    >
                      Home
                    </Link>
                    <Link
                      to="/about"
                      className="block text-gray-300 transition-colors hover:text-white"
                    >
                      About
                    </Link>
                  </>
                )}
                <a
                  href="https://docs.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-gray-300 transition-colors hover:text-white"
                >
                  Docs
                </a>
                <div className="space-y-2 border-t border-gray-800 pt-4">
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-center text-gray-300 transition-colors hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-2 text-center font-medium text-white"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
