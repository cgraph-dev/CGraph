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

import { ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Navigation from './layout/Navigation';
import Footer from './layout/Footer';
import { GlobalBackground } from './layout/GlobalBackground';
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
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="marketing-enhanced relative min-h-screen overflow-hidden">
      <GlobalBackground />

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
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.15,
                }}
                className="marketing-hero__eyebrow"
              >
                <span className="marketing-hero__eyebrow-chrome" aria-hidden="true" />
                <motion.span
                  className="marketing-hero__eyebrow-dot"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="marketing-hero__eyebrow-text">{eyebrow}</span>
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
            <a
              href="https://web.cgraph.org/register"
              className="marketing-btn marketing-btn--primary"
            >
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
