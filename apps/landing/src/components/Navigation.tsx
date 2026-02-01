/**
 * Shared Navigation Component
 *
 * Mobile-responsive navigation with hamburger menu.
 * Used across all landing pages for consistency.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogoIcon } from './Logo';

// Web app URL for auth redirects (direct navigation, not SPA routing)
const WEB_APP_URL = 'https://web.cgraph.org';

interface NavigationProps {
  transparent?: boolean;
}

export function Navigation({ transparent = false }: NavigationProps) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: '/about', label: 'About' },
    { to: '/careers', label: 'Careers' },
    { to: '/contact', label: 'Contact' },
    { to: '/press', label: 'Press' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled || !transparent
            ? 'border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="group flex items-center gap-3">
              <LogoIcon size={32} showGlow animated color="gradient" />
              <span className="text-xl font-bold tracking-tight text-white">CGraph</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.to) ? 'text-emerald-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden items-center gap-3 md:flex">
              <a
                href={`${WEB_APP_URL}/login`}
                className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                Sign In
              </a>
              <a
                href={`${WEB_APP_URL}/register`}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-cyan-400 hover:shadow-emerald-500/30"
              >
                Get Started
              </a>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-transparent transition-colors hover:border-emerald-500/30 hover:bg-white/5 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <span
                className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${
                  mobileMenuOpen ? 'translate-y-2 rotate-45' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${
                  mobileMenuOpen ? 'scale-x-0 opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${
                  mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-[min(320px,85vw)] transform bg-gradient-to-b from-[#0f0a1f] to-[#030712] transition-transform duration-300 ease-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col p-6">
          {/* Mobile Menu Header */}
          <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
            <Link
              to="/"
              className="flex items-center gap-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogoIcon size={28} showGlow animated color="gradient" />
              <span className="text-lg font-semibold text-white">CGraph</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Links */}
          <div className="flex-1 space-y-2">
            <Link
              to="/"
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-all ${
                location.pathname === '/'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xl">🏠</span>
              Home
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-all ${
                  isActive(link.to)
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-xl">
                  {link.label === 'About' && '📖'}
                  {link.label === 'Careers' && '💼'}
                  {link.label === 'Contact' && '✉️'}
                  {link.label === 'Press' && '📰'}
                </span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu CTA */}
          <div className="mt-auto space-y-3 border-t border-white/10 pt-6">
            <a
              href={`${WEB_APP_URL}/login`}
              className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              Sign In
            </a>
            <a
              href={`${WEB_APP_URL}/register`}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navigation;
