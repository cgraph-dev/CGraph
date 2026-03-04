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
import { LiquidGlassLayout } from '@/components/liquid-glass';
import SEO from '@/components/SEO';
import { docArticles } from '@/data/docs';

// Get all article slugs in order
const allSlugs = Object.keys(docArticles);

export default function DocArticle() {
  const { slug } = useParams<{ slug: string }>();

  const article = slug ? docArticles[slug] : null;

  if (!article) {
    return (
      <LiquidGlassLayout
        title="Article Not Found"
        subtitle="The documentation article you're looking for doesn't exist."
      >
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <Link to="/docs" className="text-glow-purple hover:underline">
              ← Back to Documentation
            </Link>
          </div>
        </section>
      </LiquidGlassLayout>
    );
  }

  // Find adjacent articles for navigation
  const currentIndex = slug ? allSlugs.indexOf(slug) : -1;
  const prevSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
  const nextSlug = currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;
  const prevArticle = prevSlug ? docArticles[prevSlug] : null;
  const nextArticle = nextSlug ? docArticles[nextSlug] : null;

  return (
    <LiquidGlassLayout title={article.title} subtitle={article.category}>
      <SEO
        title={`${article.title} — Docs`}
        description={`${article.category} documentation — ${article.readTime} read.`}
        path={`/docs/${slug}`}
        type="article"
      />

      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-2 text-sm text-slate-500"
          >
            <Link to="/docs" className="text-glow-purple hover:underline">
              Documentation
            </Link>
            <span>›</span>
            <span className="text-purple-700">{article.category}</span>
            <span>›</span>
            <span className="text-slate-900">{article.title}</span>
          </motion.div>

          {/* Article Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-lg">
              {article.categoryIcon}
            </span>
            <div>
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                {article.category}
              </span>
              <span className="ml-3 text-sm text-slate-500">{article.readTime}</span>
            </div>
          </motion.div>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-slate prose-headings:text-slate-900 prose-a:text-glow-purple max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(article.content, { USE_PROFILES: { html: true } }),
            }}
          />

          {/* Previous / Next Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2"
          >
            {prevArticle && prevSlug ? (
              <Link
                to={`/docs/${prevSlug}`}
                className="glass-surface group rounded-xl p-4 shadow-glass transition-shadow hover:shadow-glass-lg"
              >
                <span className="text-xs text-slate-500">← Previous</span>
                <h4 className="mt-1 text-sm font-semibold text-slate-900 group-hover:text-glow-purple">
                  {prevArticle.title}
                </h4>
              </Link>
            ) : (
              <div />
            )}
            {nextArticle && nextSlug ? (
              <Link
                to={`/docs/${nextSlug}`}
                className="glass-surface group rounded-xl p-4 text-right shadow-glass transition-shadow hover:shadow-glass-lg"
              >
                <span className="text-xs text-slate-500">Next →</span>
                <h4 className="mt-1 text-sm font-semibold text-slate-900 group-hover:text-glow-purple">
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
              className="inline-flex items-center gap-2 text-sm text-glow-purple hover:underline"
            >
              ← Back to all documentation
            </Link>
          </motion.div>
        </div>
      </section>
    </LiquidGlassLayout>
  );
}
