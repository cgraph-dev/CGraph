/**
 * Press Page
 *
 * Media resources, press kit, and company news.
 *
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { LiquidGlassLayout } from '@/components/liquid-glass';

const pressReleases = [
  {
    date: 'January 2026',
    title: 'CGraph Launches: Customizable Community Platform',
    summary:
      'CGraph launches a privacy-first communication platform combining secure messaging, forums, and community engagement.',
    link: '/press-kit/press-release-2026-01.md',
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
    formats: 'PNG',
    icon: '🎨',
    href: '/press-kit/assets/logo.png',
  },
  {
    name: 'Brand Guidelines',
    description: 'Colors, typography, and usage guidelines',
    formats: 'Markdown',
    icon: '📐',
    href: '/press-kit/brand-guidelines.md',
  },
  {
    name: 'Product Screenshots',
    description: 'High-resolution app screenshots for press use',
    formats: 'PNG',
    icon: '📱',
    href: '/press-kit/assets/og-image.png',
  },
  {
    name: 'Fact Sheet',
    description: 'Structured company profile, product, and contact data',
    formats: 'JSON',
    icon: '📊',
    href: '/press-kit/fact-sheet.json',
  },
];

const companyFacts = [
  { label: 'Founded', value: '2026' },
  { label: 'Headquarters', value: 'Georgia' },
  { label: 'Team Size', value: 'Solo Founder' },
  { label: 'Stage', value: 'Active Development' },
  { label: 'Core Product', value: 'Privacy-First Community Platform' },
  { label: 'Primary Contact', value: 'press@cgraph.org' },
  { label: 'Website', value: 'cgraph.org' },
];

export default function Press() {
  return (
    <LiquidGlassLayout
      title="Press & Media"
      subtitle="Media resources and company information"
      maxWidth="max-w-5xl"
    >
      {/* Press Kit Download */}
      <section className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-surface rounded-2xl p-8 text-center shadow-glass"
        >
          <h2 className="mb-4 text-2xl font-bold text-slate-900">Professional Press Kit</h2>
          <p className="mb-6 text-slate-500">
            Download a complete, publication-ready package with approved copy, brand assets, fact
            sheet, and launch press release.
          </p>

          <div className="mx-auto mb-6 grid max-w-3xl gap-3 text-left sm:grid-cols-2">
            {[
              'Brand guidelines and approved boilerplate',
              'Fact sheet with structured company metadata',
              'High-resolution product and brand visuals',
              'Launch press release and media contact info',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-500">
                <span className="mt-0.5 text-purple-500">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/downloads/cgraph-press-kit.zip"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 font-medium text-white shadow-glass transition-colors hover:bg-purple-600"
            >
              Download Press Kit (ZIP)
            </a>
            <a
              href="/press-kit/README.md"
              className="glass-surface inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium text-slate-700 shadow-glass transition-shadow hover:shadow-glass-lg"
            >
              Preview Contents
            </a>
          </div>
        </motion.div>
      </section>

      {/* Brand Assets */}
      <section className="py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-slate-900">Brand Assets</h2>
          <p className="text-lg text-slate-500">Download individual assets for your coverage</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {brandAssets.map((asset, index) => (
            <motion.a
              key={asset.name}
              href={asset.href}
              download
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-surface group rounded-xl p-5 shadow-glass transition-shadow hover:shadow-glass-lg"
            >
              <div className="mb-3 text-4xl">{asset.icon}</div>
              <h3 className="mb-1 font-semibold text-slate-900">{asset.name}</h3>
              <p className="mb-3 text-sm text-slate-500">{asset.description}</p>
              <span className="text-xs text-glow-purple">{asset.formats}</span>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Company Facts */}
      <section className="py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-slate-900">Company Facts</h2>
          <p className="text-lg text-slate-500">Key information about CGraph</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-surface mx-auto max-w-3xl rounded-2xl p-6 shadow-glass"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {companyFacts.map((fact) => (
              <div
                key={fact.label}
                className="flex justify-between border-b border-slate-200/50 pb-3 last:border-0 sm:border-0 sm:pb-0"
              >
                <span className="text-slate-500">{fact.label}</span>
                <span className="font-medium text-slate-900">{fact.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Press Releases */}
      <section className="py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-slate-900">Press Releases</h2>
          <p className="text-lg text-slate-500">Recent announcements and news</p>
        </motion.div>

        <div className="space-y-6">
          {pressReleases.map((release, index) => (
            <motion.a
              key={release.title}
              href={release.link}
              download
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-surface group block rounded-xl p-5 shadow-glass"
            >
              <span className="text-sm text-glow-purple">{release.date}</span>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-glow-purple">
                {release.title}
              </h3>
              <p className="mt-2 text-slate-500">{release.summary}</p>
              <span className="mt-3 inline-block text-sm text-glow-purple">Download release →</span>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Media Coverage - Coming Soon */}
      {mediaAppearances.length > 0 && (
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-slate-900">In the News</h2>
            <p className="text-lg text-slate-500">Selected media coverage</p>
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
                className="glass-surface group rounded-xl p-5 shadow-glass"
              >
                <span className="text-sm font-medium text-glow-purple">{article.outlet}</span>
                <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-glow-purple">
                  {article.title}
                </h3>
                <span className="mt-2 block text-sm text-slate-500">{article.date}</span>
              </motion.a>
            ))}
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-surface rounded-2xl p-8 text-center shadow-glass"
        >
          <h2 className="mb-4 text-xl font-bold text-slate-900">Media Inquiries</h2>
          <p className="mb-6 text-slate-500">
            For interview requests, press inquiries, or additional information, please contact our
            media relations team.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:press@cgraph.org"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 font-medium text-white shadow-glass transition-colors hover:bg-purple-600"
            >
              press@cgraph.org
            </a>
          </div>
        </motion.div>
      </section>
    </LiquidGlassLayout>
  );
}
