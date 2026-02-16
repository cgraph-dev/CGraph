/**
 * Blog Article Page - Individual blog post rendering
 *
 * Renders full article content for each blog post using slug-based routing.
 * All content reflects real milestones from the project changelog and documentation.
 *
 * @since v0.9.15
 */

import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { MarketingLayout } from '@/components/marketing';
import { NeonIcon } from '@/components/marketing/ui';
import SEO from '@/components/SEO';
import { blogArticles, categoryColors, articleSlugs } from '@/data/blog';

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? blogArticles[slug] : undefined;

  if (!article) {
    return (
      <MarketingLayout
        title="Article Not Found"
        subtitle="The blog article you're looking for doesn't exist."
        eyebrow="Blog"
      >
        <section className="marketing-section marketing-section--dark">
          <div className="marketing-section__container" style={{ textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(139, 92, 246, 0.15))',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <NeonIcon symbol="📄" size={40} title="Document" />
              </div>
              <p className="mb-8 text-lg" style={{ color: 'var(--color-gray)' }}>
                This article may have been moved or removed.
              </p>
              <Link to="/blog" className="marketing-btn marketing-btn--primary">
                ← Back to Blog
              </Link>
            </motion.div>
          </div>
        </section>
      </MarketingLayout>
    );
  }

  const catColor = categoryColors[article.category] ?? {
    bg: 'rgba(99, 102, 241, 0.12)',
    text: '#818cf8',
  };

  // Find previous/next articles
  const currentIndex = articleSlugs.indexOf(slug!);
  const prevSlug = currentIndex > 0 ? articleSlugs[currentIndex - 1] : null;
  const nextSlug = currentIndex < articleSlugs.length - 1 ? articleSlugs[currentIndex + 1] : null;
  const prevArticle = prevSlug ? blogArticles[prevSlug] : null;
  const nextArticle = nextSlug ? blogArticles[nextSlug] : null;

  // Get related articles (same category, excluding current)
  const relatedArticles = articleSlugs
    .filter((s) => s !== slug && blogArticles[s]?.category === article.category)
    .slice(0, 3);

  return (
    <MarketingLayout
      title={article.title}
      subtitle={`${article.date} · ${article.readTime}`}
      eyebrow={article.category}
    >
      <SEO
        title={article.title}
        description={`${article.category} — ${article.date}. ${article.readTime} read.`}
        path={`/blog/${slug}`}
        type="article"
      />
      {/* Back to Blog */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '1rem', paddingBottom: '0' }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm transition-colors hover:text-emerald-400"
              style={{ color: 'var(--color-gray)' }}
            >
              ← Back to Blog
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Article Header */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Category Badge */}
            <span
              className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: catColor.bg, color: catColor.text }}
            >
              {article.category}
            </span>

            {/* Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/5 bg-white/5 px-2.5 py-1 text-xs"
                  style={{ color: 'var(--color-gray)' }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Author Box */}
            <div className="flex items-center gap-3 border-t border-white/5 pt-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                }}
              >
                BL
              </div>
              <div>
                <div className="text-sm font-medium text-white">{article.author}</div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--color-gray)' }}
                >
                  <span>{article.date}</span>
                  <span className="opacity-40">·</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="legal-content"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(article.content, {
                  USE_PROFILES: { html: true },
                }),
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Previous / Next Navigation */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            {prevArticle && prevSlug ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <Link
                  to={`/blog/${prevSlug}`}
                  className="marketing-card group block overflow-hidden transition-all hover:border-emerald-500/30"
                  style={{ padding: '1.25rem' }}
                >
                  <span className="mb-1 block text-xs" style={{ color: 'var(--color-gray)' }}>
                    ← Previous
                  </span>
                  <span className="block text-sm font-medium text-white transition-colors group-hover:text-emerald-300">
                    {prevArticle.title}
                  </span>
                </Link>
              </motion.div>
            ) : (
              <div className="flex-1" />
            )}

            {nextArticle && nextSlug ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1 text-right"
              >
                <Link
                  to={`/blog/${nextSlug}`}
                  className="marketing-card group block overflow-hidden transition-all hover:border-emerald-500/30"
                  style={{ padding: '1.25rem' }}
                >
                  <span className="mb-1 block text-xs" style={{ color: 'var(--color-gray)' }}>
                    Next →
                  </span>
                  <span className="block text-sm font-medium text-white transition-colors group-hover:text-emerald-300">
                    {nextArticle.title}
                  </span>
                </Link>
              </motion.div>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </section>

      {/* More Articles */}
      {relatedArticles.length > 0 && (
        <section className="marketing-section marketing-section--alt">
          <div className="mx-auto max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-6 text-xl font-bold" style={{ color: 'var(--color-light)' }}>
                More in {article.category}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((relSlug) => {
                  const rel = blogArticles[relSlug];
                  if (!rel) return null;
                  const relCatColor = categoryColors[rel.category] ?? {
                    bg: 'rgba(99, 102, 241, 0.12)',
                    text: '#818cf8',
                  };
                  return (
                    <Link
                      key={relSlug}
                      to={`/blog/${relSlug}`}
                      className="marketing-card group block overflow-hidden transition-all hover:border-emerald-500/30"
                      style={{ padding: 0 }}
                    >
                      <div
                        className="h-1 w-full"
                        style={{
                          background: `linear-gradient(90deg, ${relCatColor.text}, var(--color-secondary))`,
                        }}
                      />
                      <div className="p-5">
                        <span
                          className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            background: relCatColor.bg,
                            color: relCatColor.text,
                          }}
                        >
                          {rel.category}
                        </span>
                        <h4 className="mb-2 text-sm font-semibold text-white transition-colors group-hover:text-emerald-300">
                          {rel.title}
                        </h4>
                        <div
                          className="flex items-center gap-2 text-xs"
                          style={{ color: 'var(--color-gray)' }}
                        >
                          <span>{rel.date}</span>
                          <span className="opacity-40">·</span>
                          <span>{rel.readTime}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* All Articles Link */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '2rem', paddingBottom: '3rem' }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Link to="/blog" className="marketing-btn marketing-btn--secondary">
            View All Articles
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
