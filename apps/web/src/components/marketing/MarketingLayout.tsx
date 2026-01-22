/**
 * Marketing Layout Component
 *
 * Shared layout wrapper for all marketing/public pages.
 * Provides consistent navigation, footer, and styling.
 * Enhanced with landing page aesthetics.
 *
 * @since v0.9.2
 * @updated v0.9.4 - Added enhanced styling matching landing page
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Navigation from './Navigation';
import Footer from './Footer';
import './marketing-pages.css';

interface MarketingLayoutProps {
  children: ReactNode;
  /** Page title for the header section */
  title?: string;
  /** Page subtitle/description */
  subtitle?: string;
  /** Eyebrow text above title */
  eyebrow?: string;
  /** Whether to show the CTA section before footer */
  showCTA?: boolean;
  /** Whether navigation should be transparent initially */
  transparentNav?: boolean;
  /** Whether to show landing page links in nav */
  showLandingLinks?: boolean;
}

export default function MarketingLayout({
  children,
  title,
  subtitle,
  eyebrow,
  showCTA = false,
  transparentNav = false,
  showLandingLinks = false,
}: MarketingLayoutProps) {
  return (
    <div className="marketing-enhanced relative min-h-screen overflow-hidden">
      {/* Animated Background - CSS-only for better performance */}
      <div className="marketing-animated-bg">
        {/* Floating orbs with CSS animations (no React re-renders) */}
        <div className="marketing-bg-orb marketing-bg-orb--1" />
        <div className="marketing-bg-orb marketing-bg-orb--2" />
        <div className="marketing-bg-orb marketing-bg-orb--3" />
        {/* Subtle grid overlay */}
        <div className="marketing-bg-grid" />
      </div>

      <Navigation transparent={transparentNav} showLandingLinks={showLandingLinks} />

      {/* Enhanced Page Header */}
      {title && (
        <section className="marketing-hero">
          {/* Ambient orbs */}
          <div className="marketing-orb marketing-orb--emerald absolute -left-32 top-20 h-96 w-96" />
          <div className="marketing-orb marketing-orb--purple absolute -right-32 bottom-0 h-80 w-80" />

          <div className="relative z-10 mx-auto max-w-4xl px-4">
            {eyebrow && (
              <motion.span
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="marketing-hero__eyebrow"
              >
                {eyebrow}
              </motion.span>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="marketing-hero__title font-zentry"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="marketing-hero__subtitle font-robert"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className={!title ? 'pt-24' : ''}>{children}</main>

      {/* Enhanced CTA Section */}
      {showCTA && <CTASection />}

      <Footer />
    </div>
  );
}

// Enhanced CTA Section matching landing page
function CTASection() {
  return (
    <section className="marketing-cta">
      <div className="marketing-cta__content">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="marketing-cta__title font-zentry">
            Build Your <span className="marketing-hero__highlight">Community</span>
          </h2>
          <p className="marketing-cta__desc font-robert">
            Create forums, customize your space, and connect with like-minded people.
          </p>
          <div className="marketing-cta__buttons">
            <a href="/register" className="marketing-btn marketing-btn--primary">
              Create Account
            </a>
            <a href="/contact" className="marketing-btn marketing-btn--secondary">
              Contact Sales
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
