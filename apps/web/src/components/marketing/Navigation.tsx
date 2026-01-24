/**
 * Marketing Navigation Component
 *
 * Floating pill-style navigation matching the landing page design.
 * Features hide-on-scroll-down behavior, animated gradient border,
 * and emerald/purple color scheme.
 *
 * @since v0.9.2
 * @updated v0.9.5 - Unified with landing page style
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './marketing-pages.css';

interface NavigationProps {
  /** Whether to show landing page anchor links (Features, Security, Pricing) */
  showLandingLinks?: boolean;
  /** Whether to use transparent background initially (for hero sections) */
  transparent?: boolean;
}

export default function Navigation({
  showLandingLinks = false,
  transparent: _transparent = true,
}: NavigationProps) {
  // transparent prop reserved for future hero section styling
  void _transparent;
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide/show based on scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      // Background opacity based on scroll position
      setScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Navigation - Floating Pill Style */}
      <motion.nav
        className={`gl-nav-unified ${scrolled ? 'scrolled' : ''} ${hidden ? 'hidden' : ''}`}
        initial={{ x: '-50%', y: -100, opacity: 0 }}
        animate={{
          x: '-50%',
          y: hidden ? -100 : 0,
          opacity: hidden ? 0 : 1,
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Animated gradient border */}
        <div className="gl-nav-unified__border" />

        {/* Logo */}
        <Link to="/" className="gl-nav-unified__logo">
          <svg viewBox="0 0 32 32" className="gl-nav-unified__logo-icon">
            <path
              d="M16 2L4 9v14l12 7 12-7V9L16 2zm0 4l8 4.5v9L16 24l-8-4.5v-9L16 6z"
              fill="url(#nav-logo-gradient)"
            />
            <defs>
              <linearGradient id="nav-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span>CGraph</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="gl-nav-unified__links">
          {showLandingLinks ? (
            <>
              <a href="#features" className="gl-nav-unified__link">
                Features
              </a>
              <a href="#security" className="gl-nav-unified__link">
                Security
              </a>
              <a href="#pricing" className="gl-nav-unified__link">
                Pricing
              </a>
            </>
          ) : (
            <>
              <Link to="/" className="gl-nav-unified__link">
                Home
              </Link>
              <Link to="/about" className="gl-nav-unified__link">
                About
              </Link>
            </>
          )}
          <a
            href="https://docs.cgraph.org"
            target="_blank"
            rel="noopener noreferrer"
            className="gl-nav-unified__link"
          >
            Docs
          </a>
        </div>

        {/* CTA Button */}
        <Link to="/register" className="gl-nav-unified__cta">
          <span className="gl-nav-unified__cta-text">Get Started</span>
          <svg
            className="gl-nav-unified__cta-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>

        {/* Mobile menu button */}
        <button
          className="gl-nav-unified__mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span className={`gl-nav-unified__hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="gl-nav-unified__mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="gl-nav-unified__mobile-links">
              {showLandingLinks ? (
                <>
                  <a href="#features" className="gl-nav-unified__mobile-link">
                    Features
                  </a>
                  <a href="#security" className="gl-nav-unified__mobile-link">
                    Security
                  </a>
                  <a href="#pricing" className="gl-nav-unified__mobile-link">
                    Pricing
                  </a>
                </>
              ) : (
                <>
                  <Link to="/" className="gl-nav-unified__mobile-link">
                    Home
                  </Link>
                  <Link to="/about" className="gl-nav-unified__mobile-link">
                    About
                  </Link>
                </>
              )}
              <a
                href="https://docs.cgraph.org"
                target="_blank"
                rel="noopener noreferrer"
                className="gl-nav-unified__mobile-link"
              >
                Docs
              </a>
              <div className="gl-nav-unified__mobile-divider" />
              <Link to="/login" className="gl-nav-unified__mobile-link">
                Sign In
              </Link>
              <Link to="/register" className="gl-nav-unified__mobile-cta">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
