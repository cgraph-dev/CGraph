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

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoIcon } from '@/components/Logo';
import '../marketing-pages.css';

/* ── Magnetic nav link ─────────────────────────────────────────────── */
const MAGNETIC_STRENGTH = 0.18;
const SPRING_CONFIG = { type: 'spring' as const, stiffness: 180, damping: 18, mass: 0.1 };

function NavLink({
  href,
  to,
  children,
}: {
  href?: string;
  to?: string;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const isActive = Boolean(to && location.pathname === to);

  const onMove = useCallback((e: React.MouseEvent) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    setPos({
      x: (e.clientX - (left + width / 2)) * MAGNETIC_STRENGTH,
      y: (e.clientY - (top + height / 2)) * MAGNETIC_STRENGTH,
    });
  }, []);

  const onLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);

  const shared = {
    className: `gl-nav-unified__link group ${isActive ? 'is-active' : ''}`,
    onMouseMove: onMove,
    onMouseLeave: onLeave,
    animate: { x: pos.x, y: pos.y },
    transition: SPRING_CONFIG,
  };

  const inner = (
    <>
      <span className="gl-nav-unified__link-text">{children}</span>
      <span className="gl-nav-unified__link-shimmer" />
      <span className="gl-nav-unified__link-sweep" />
    </>
  );

  if (to) {
    return (
      <motion.span {...shared} style={{ display: 'inline-flex' }}>
        <Link to={to} className="gl-nav-unified__link-inner">
          {inner}
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.a href={href} {...shared}>
      {inner}
    </motion.a>
  );
}

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
  const [cta, setCta] = useState({ x: 0, y: 0 });
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

      // Close mobile menu on any scroll
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }

      // Background opacity based on scroll position
      setScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Skip to content — a11y best practice */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
      >
        Skip to content
      </a>

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
        <Link to="/" className="gl-nav-unified__logo" aria-label="CGraph Home">
          <LogoIcon size={48} showGlow={false} color="gradient" />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="gl-nav-unified__links">
          {showLandingLinks ? (
            <>
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#security">Security</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
              <NavLink to="/about">About</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/about">About</NavLink>
            </>
          )}
        </div>

        {/* CTA Button */}
        <motion.a
          href="https://web.cgraph.org/register"
          className="gl-nav-unified__cta group"
          onMouseMove={(e: React.MouseEvent) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            setCta({
              x: (e.clientX - (left + width / 2)) * 0.15,
              y: (e.clientY - (top + height / 2)) * 0.15,
            });
          }}
          onMouseLeave={() => setCta({ x: 0, y: 0 })}
          animate={{ x: cta.x, y: cta.y }}
          transition={SPRING_CONFIG}
        >
          {/* Animated gradient border ring */}
          <span className="gl-nav-unified__cta-ring" />

          {/* Inner glow on hover */}
          <span className="gl-nav-unified__cta-glow" />
          {/* Content */}
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
          {/* Bottom shimmer line */}
          <span className="gl-nav-unified__cta-shimmer" />
        </motion.a>

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

      {/* Mobile Menu — full-width dropdown below nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="gl-nav-unified__mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="gl-nav-unified__mobile-links">
              {showLandingLinks ? (
                <>
                  <a
                    href="#features"
                    className="gl-nav-unified__mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a
                    href="#security"
                    className="gl-nav-unified__mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Security
                  </a>
                  <a
                    href="#pricing"
                    className="gl-nav-unified__mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </a>
                  <Link
                    to="/about"
                    className="gl-nav-unified__mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="gl-nav-unified__mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/about"
                    className="gl-nav-unified__mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </>
              )}
              <div className="gl-nav-unified__mobile-divider" />
              <a href="https://web.cgraph.org/login" className="gl-nav-unified__mobile-link">
                Sign In
              </a>
              <a href="https://web.cgraph.org/register" className="gl-nav-unified__mobile-cta">
                <span className="gl-nav-unified__mobile-cta-ring" />

                <span className="gl-nav-unified__mobile-cta-glow" />
                <span className="gl-nav-unified__mobile-cta-text">Get Started</span>
                <svg
                  className="gl-nav-unified__mobile-cta-arrow"
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
                <span className="gl-nav-unified__mobile-cta-shimmer" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
