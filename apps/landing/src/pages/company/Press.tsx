/**
 * Press Page
 *
 * Media resources, press kit, and company news.
 *
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';
import { NeonIcon } from '@/components/marketing/ui';

const pressReleases = [
  {
    date: 'January 2026',
    title: 'CGraph Launches: Customizable Community Platform',
    summary:
      'Introducing CGraph — a new communication platform combining powerful customization with gamified community features.',
    link: '#',
  },
];

const mediaAppearances: Array<{
  outlet: string;
  title: string;
  date: string;
  link: string;
}> = [
  // Media coverage coming soon
];

const brandAssets = [
  {
    name: 'Logo Pack',
    description: 'Full logo in various formats (SVG, PNG, PDF)',
    formats: 'SVG, PNG, PDF',
    icon: '🎨',
  },
  {
    name: 'Brand Guidelines',
    description: 'Colors, typography, and usage guidelines',
    formats: 'PDF',
    icon: '📐',
  },
  {
    name: 'Product Screenshots',
    description: 'High-resolution app screenshots for press use',
    formats: 'PNG, JPG',
    icon: '📱',
  },
  {
    name: 'Team Photos',
    description: 'Founder and team photos for press articles',
    formats: 'JPG',
    icon: '👥',
  },
];

const companyFacts = [
  { label: 'Founded', value: '2026' },
  { label: 'Headquarters', value: 'Georgia' },
  { label: 'Team Size', value: 'Solo Founder' },
  { label: 'Stage', value: 'In Development' },
];

export default function Press() {
  return (
    <MarketingLayout
      title="Press & Media"
      subtitle="Resources for journalists and media professionals"
      eyebrow="Media Resources"
    >
      {/* Press Kit Download */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card text-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
            }}
          >
            <h2 className="mb-4 text-2xl font-bold text-white">Download Press Kit</h2>
            <p className="mb-6 text-gray-400">
              Get logos, brand guidelines, product screenshots, and everything you need for your
              story.
            </p>
            <a
              href="#"
              className="inline-flex rounded-lg px-8 py-4 font-semibold text-white shadow-lg transition-all"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                boxShadow: '0 10px 40px rgba(16, 185, 129, 0.25)',
              }}
            >
              Download Press Kit (ZIP)
            </a>
          </motion.div>
        </div>
      </section>

      {/* Brand Assets */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-section__header"
          >
            <h2 className="marketing-section__title font-zentry">Brand Assets</h2>
            <p className="marketing-section__desc">Download individual assets for your coverage</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {brandAssets.map((asset, index) => (
              <motion.a
                key={asset.name}
                href="#"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="marketing-card group"
                style={{ padding: '1.5rem' }}
              >
                <div className="mb-3">
                  <NeonIcon symbol={asset.icon} size={36} title={asset.name} />
                </div>
                <h3 className="mb-1 font-semibold text-white">{asset.name}</h3>
                <p className="mb-3 text-sm text-gray-400">{asset.description}</p>
                <span className="text-xs" style={{ color: 'var(--color-primary)' }}>
                  {asset.formats}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Company Facts */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-section__header"
          >
            <h2 className="marketing-section__title font-zentry">Company Facts</h2>
            <p className="marketing-section__desc">Key information about CGraph</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card mx-auto max-w-3xl"
            style={{ padding: '1.5rem' }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {companyFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex justify-between border-b border-white/10 pb-3 last:border-0 sm:border-0 sm:pb-0"
                >
                  <span className="text-gray-400">{fact.label}</span>
                  <span className="font-medium text-white">{fact.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container" style={{ maxWidth: '56rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-section__header"
          >
            <h2 className="marketing-section__title font-zentry">Press Releases</h2>
            <p className="marketing-section__desc">Recent announcements and news</p>
          </motion.div>

          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <motion.a
                key={release.title}
                href={release.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="marketing-card group block"
                style={{ padding: '1.5rem' }}
              >
                <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
                  {release.date}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-emerald-300">
                  {release.title}
                </h3>
                <p className="mt-2 text-gray-400">{release.summary}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Media Coverage - Coming Soon */}
      {mediaAppearances.length > 0 && (
        <section className="marketing-section marketing-section--alt">
          <div className="marketing-section__container" style={{ maxWidth: '56rem' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="marketing-section__header"
            >
              <h2 className="marketing-section__title font-zentry">In the News</h2>
              <p className="marketing-section__desc">Selected media coverage</p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
              {mediaAppearances.map((article, index) => (
                <motion.a
                  key={article.title}
                  href={article.link}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="marketing-card group"
                  style={{ padding: '1.5rem' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                    {article.outlet}
                  </span>
                  <h3 className="mt-2 font-semibold text-white group-hover:text-emerald-300">
                    {article.title}
                  </h3>
                  <span className="mt-2 block text-sm text-gray-500">{article.date}</span>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="marketing-section marketing-section--tertiary">
        <div className="marketing-section__container" style={{ maxWidth: '48rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card text-center"
            style={{ padding: '2rem' }}
          >
            <h2 className="mb-4 text-xl font-bold text-white">Media Inquiries</h2>
            <p className="mb-6 text-gray-400">
              For interview requests, press inquiries, or additional information, please contact our
              media relations team.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:press@cgraph.org"
                className="inline-flex rounded-lg px-6 py-3 font-medium text-white shadow-lg transition-all"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                  boxShadow: '0 10px 40px rgba(16, 185, 129, 0.25)',
                }}
              >
                press@cgraph.org
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
