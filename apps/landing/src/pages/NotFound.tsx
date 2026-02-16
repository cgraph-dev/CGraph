/**
 * 404 Not Found Page
 *
 * Branded 404 page with navigation back to the homepage.
 * Uses MarketingLayout for consistent styling.
 *
 * @since v0.9.27
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';
import SEO from '@/components/SEO';

export default function NotFound() {
  return (
    <MarketingLayout
      title="Page Not Found"
      subtitle="The page you're looking for doesn't exist or has been moved."
      eyebrow="404"
    >
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
        noindex
      />
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container" style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              style={{
                fontSize: '8rem',
                fontWeight: 800,
                lineHeight: 1,
                background: 'linear-gradient(135deg, #10b981, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1.5rem',
              }}
            >
              404
            </div>
            <p
              className="mb-8 text-lg"
              style={{ color: 'var(--color-gray)', maxWidth: 420, margin: '0 auto 2rem' }}
            >
              This page may have been moved or removed. Check the URL or head back home.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/" className="marketing-btn marketing-btn--primary">
                ← Back to Home
              </Link>
              <Link to="/docs" className="marketing-btn marketing-btn--secondary">
                Documentation
              </Link>
              <Link to="/blog" className="marketing-btn marketing-btn--secondary">
                Blog
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
