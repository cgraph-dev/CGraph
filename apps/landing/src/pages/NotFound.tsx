/**
 * 404 Not Found Page
 *
 * Branded 404 page with navigation back to the homepage.
 * Uses LiquidGlassLayout for consistent styling.
 *
 * @since v0.9.27
 * @updated v0.9.30 - Migrated to Liquid Glass design system
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LiquidGlassLayout } from '@/components/liquid-glass';
import SEO from '@/components/SEO';

export default function NotFound() {
  return (
    <LiquidGlassLayout title="Page Not Found" subtitle="The page you're looking for doesn't exist">
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
        noindex
      />
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 text-8xl font-bold text-slate-200"
            >
              404
            </motion.div>
            <p className="mx-auto mb-8 max-w-md text-lg text-slate-500">
              This page may have been moved or removed. Check the URL or head back home.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 font-medium text-white shadow-glass transition-colors hover:bg-purple-600"
              >
                ← Go Home
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/50 px-6 py-3 font-medium text-slate-700 shadow-glass backdrop-blur-sm transition-colors hover:bg-white/80"
              >
                Documentation
              </Link>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/50 px-6 py-3 font-medium text-slate-700 shadow-glass backdrop-blur-sm transition-colors hover:bg-white/80"
              >
                Blog
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </LiquidGlassLayout>
  );
}
