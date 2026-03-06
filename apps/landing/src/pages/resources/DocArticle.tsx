/**
 * Documentation Article Page - Individual doc article rendering
 *
 * Renders full article content for each documentation topic using slug-based routing.
 * All content reflects real platform features and architecture.
 *
 * @since v0.9.15
 */

import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { MarketingLayout } from '@/components/marketing';
import { NeonIcon } from '@/components/marketing/ui';
import SEO from '@/components/SEO';
import { docArticles } from '@/data/docs';

// Get all article slugs in order
const allSlugs = Object.keys(docArticles);

export default function DocArticle() {
  const { slug } = useParams<{ slug: string }>();

  const article = slug ? docArticles[slug] : null;

  if (!article) {
    return (
      <MarketingLayout
        title="Article Not Found"
        subtitle="The documentation article you're looking for doesn't exist."
        eyebrow="404"
      >
        <section className="marketing-section marketing-section--alt">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <Link to="/docs" className="marketing-btn marketing-btn--primary">
              ← Back to Documentation
            </Link>
          </div>
        </section>
      </MarketingLayout>
    );
  }

  // Find adjacent articles for navigation
  const currentIndex = slug ? allSlugs.indexOf(slug) : -1;
  const prevSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
  const nextSlug = currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;
  const prevArticle = prevSlug ? docArticles[prevSlug] : null;
  const nextArticle = nextSlug ? docArticles[nextSlug] : null;

  return (
    <MarketingLayout
      title={article.title}
      subtitle={`${article.category}`}
      eyebrow="Documentation"
    >
      <SEO
        title={`${article.title} — Docs`}
        description={`${article.category} documentation.`}
        path={`/docs/${slug}`}
        type="article"
      />
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-gray)' }}
          >
            <Link to="/docs" className="transition-colors hover:text-emerald-400">
              Documentation
            </Link>
            <span>›</span>
            <span style={{ color: article.categoryColor }}>{article.category}</span>
            <span>›</span>
            <span className="text-white">{article.title}</span>
          </motion.div>

          {/* Article Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex items-center gap-3"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                background: `${article.categoryColor}15`,
                border: `1px solid ${article.categoryColor}25`,
              }}
            >
              <NeonIcon
                symbol={article.categoryIcon}
                size={22}
                color={article.categoryColor}
                title={article.category}
              />
            </span>
            <div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: `${article.categoryColor}15`,
                  color: article.categoryColor,
                }}
              >
                {article.category}
              </span>
            </div>
          </motion.div>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="legal-content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(article.content, { USE_PROFILES: { html: true } }),
            }}
          />

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-2"
          >
            {prevArticle && prevSlug ? (
              <Link
                to={`/docs/${prevSlug}`}
                className="marketing-card group p-4 transition-colors hover:border-emerald-500/30"
              >
                <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                  ← Previous
                </span>
                <h4 className="mt-1 text-sm font-semibold text-white group-hover:text-emerald-300">
                  {prevArticle.title}
                </h4>
              </Link>
            ) : (
              <div />
            )}
            {nextArticle && nextSlug ? (
              <Link
                to={`/docs/${nextSlug}`}
                className="marketing-card group p-4 text-right transition-colors hover:border-emerald-500/30"
              >
                <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                  Next →
                </span>
                <h4 className="mt-1 text-sm font-semibold text-white group-hover:text-emerald-300">
                  {nextArticle.title}
                </h4>
              </Link>
            ) : (
              <div />
            )}
          </motion.div>

          {/* Back to Docs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 text-sm transition-colors hover:text-emerald-400"
              style={{ color: 'var(--color-gray)' }}
            >
              ← Back to all documentation
            </Link>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
