/**
 * Marketing Layout Component
 * 
 * Shared layout wrapper for all marketing/public pages.
 * Provides consistent navigation, footer, and styling.
 * 
 * @since v0.9.2
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Navigation from './Navigation';
import Footer from './Footer';

interface MarketingLayoutProps {
  children: ReactNode;
  /** Page title for the header section */
  title?: string;
  /** Page subtitle/description */
  subtitle?: string;
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
  showCTA = false,
  transparentNav = false,
  showLandingLinks = false,
}: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation transparent={transparentNav} showLandingLinks={showLandingLinks} />
      
      {/* Page Header (if title provided) */}
      {title && (
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 pb-16 pt-32">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]" />
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mx-auto mt-6 max-w-2xl text-xl text-gray-400"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </section>
      )}
      
      {/* Main Content */}
      <main className={!title ? 'pt-16' : ''}>
        {children}
      </main>
      
      {/* Optional CTA Section */}
      {showCTA && <CTASection />}
      
      <Footer />
    </div>
  );
}

// CTA Section (reused from LandingPage)
function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-950 to-gray-900 py-24">
      <div className="absolute left-1/4 top-1/2 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-400">
            Join thousands of users who trust CGraph for secure, private communication.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/register"
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/25 transition-all hover:scale-105 hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40 sm:w-auto"
            >
              Create Free Account
            </a>
            <a
              href="/contact"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-10 py-4 text-lg font-semibold text-white transition-all hover:bg-gray-700 sm:w-auto"
            >
              Contact Sales
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
