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
import { LiquidGlassLayout } from '@/components/liquid-glass';
import SEO from '@/components/SEO';
import { blogArticles, categoryColors, articleSlugs } from '@/data/blog';

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? blogArticles[slug] : undefined;

  if (!article) {
    return (
      <LiquidGlassLayout
        title="Article Not Found"
        subtitle="The blog article you're looking for doesn't exist."
      >
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-50">
                <span className="text-4xl">📄</span>
              </div>
              <p className="mb-8 text-lg text-slate-500">
                This article may have been moved or removed.
              </p>
              <Link to="/blog" className="text-glow-purple hover:underline">
                ← Back to Blog
              </Link>
            </motion.div>
          </div>
        </section>
      </LiquidGlassLayout>
    );
  }

  const catColor = categoryColors[article.category] ?? {
    bg: 'rgba(99, 102, 241, 0.12)',
    text: '#818cf8',
  };

  // Find previous/next articles
  const currentIndex = (articleSlugs as readonly string[]).indexOf(slug!);
  const prevSlug = currentIndex > 0 ? articleSlugs[currentIndex - 1] : null;
  const nextSlug = currentIndex < articleSlugs.length - 1 ? articleSlugs[currentIndex + 1] : null;
  const prevArticle = prevSlug ? blogArticles[prevSlug] : null;
  const nextArticle = nextSlug ? blogArticles[nextSlug] : null;

  // Get related articles (same category, excluding current)
  const relatedArticles = articleSlugs
    .filter((s) => s !== slug && blogArticles[s]?.category === article.category)
    .slice(0, 3);

  return (
    <LiquidGlassLayout title={article.title} subtitle={article.date}>
      <SEO
        title={article.title}
        description={`${article.category} — ${article.date}. ${article.readTime} read.`}
        path={`/blog/${slug}`}
        type="article"
      />

      {/* Back to Blog */}
      <section className="pb-0 pt-4">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-glow-purple hover:underline"
            >
              ← Back to Blog
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Article Header */}
      <section className="pb-6 pt-6">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Category Badge */}
            <span className="mb-4 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
              {article.category}
            </span>

            {/* Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Author Card */}
            <div className="glass-surface rounded-2xl p-6 shadow-glass">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-sm font-bold text-white">
                  BL
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{article.author}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{article.date}</span>
                    <span className="opacity-40">·</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="prose prose-slate prose-headings:text-slate-900 prose-a:text-glow-purple max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(article.content, {
                  USE_PROFILES: { html: true },
                }),
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Share / Action Buttons */}
      <section className="py-6">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap gap-3">
            <button className="glass-surface rounded-xl px-4 py-2 text-slate-600 transition-shadow hover:shadow-glass-lg">
              Share
            </button>
            <button className="glass-surface rounded-xl px-4 py-2 text-slate-600 transition-shadow hover:shadow-glass-lg">
              Copy Link
            </button>
          </div>
        </div>
      </section>

      {/* Previous / Next Navigation */}
      <section className="py-8">
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
                  className="glass-surface group block rounded-xl p-5 shadow-glass transition-shadow hover:shadow-glass-lg"
                >
                  <span className="mb-1 block text-xs text-slate-500">← Previous</span>
                  <span className="block text-sm font-medium text-slate-900 transition-colors group-hover:text-glow-purple">
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
                  className="glass-surface group block rounded-xl p-5 shadow-glass transition-shadow hover:shadow-glass-lg"
                >
                  <span className="mb-1 block text-xs text-slate-500">Next →</span>
                  <span className="block text-sm font-medium text-slate-900 transition-colors group-hover:text-glow-purple">
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
        <section className="py-10">
          <div className="mx-auto max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-6 text-xl font-bold text-slate-900">More in {article.category}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((relSlug) => {
                  const rel = blogArticles[relSlug];
                  if (!rel) return null;
                  return (
                    <Link
                      key={relSlug}
                      to={`/blog/${relSlug}`}
                      className="glass-surface group block rounded-xl p-5 shadow-glass transition-shadow hover:shadow-glass-lg"
                    >
                      <span className="mb-2 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                        {rel.category}
                      </span>
                      <h4 className="mb-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-glow-purple">
                        {rel.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{rel.date}</span>
                        <span className="opacity-40">·</span>
                        <span>{rel.readTime}</span>
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
      <section className="pb-12 pt-8">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Link
            to="/blog"
            className="glass-surface rounded-xl px-4 py-2 text-slate-600 transition-shadow hover:shadow-glass-lg"
          >
            View All Articles
          </Link>
        </div>
      </section>
    </LiquidGlassLayout>
  );
}
