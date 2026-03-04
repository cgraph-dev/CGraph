/**
 * LiquidGlassLayout — Shared page shell for secondary pages.
 *
 * Wraps children with Navigation + Footer + pearl background.
 * Replaces MarketingLayout for all non-landing pages.
 */
import { type ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { cn, springPreset } from './shared';

interface LiquidGlassLayoutProps {
  children: ReactNode;
  /** Page heading displayed in a glass card header */
  title?: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Max width class — defaults to max-w-4xl */
  maxWidth?: string;
  /** Whether to wrap content in a glass card — defaults to true */
  glass?: boolean;
}

export function LiquidGlassLayout({
  children,
  title,
  subtitle,
  maxWidth = 'max-w-4xl',
  glass = true,
}: LiquidGlassLayoutProps) {
  const location = useLocation();

  /* Scroll to top on route change */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-pearl">
      <Navigation />

      <main className={cn('mx-auto px-6 pb-24 pt-32 lg:px-12', maxWidth)}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPreset}
          className={cn(glass && 'glass-surface rounded-3xl p-8 shadow-glass sm:p-12')}
        >
          {title && (
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {title}
              </h1>
              {subtitle && <p className="mt-2 text-lg text-slate-500">{subtitle}</p>}
            </header>
          )}
          {children}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
