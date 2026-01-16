/**
 * Press Page
 * 
 * Media resources, press kit, and company news.
 * 
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

const pressReleases = [
  {
    date: 'January 2026',
    title: 'CGraph Launches: Privacy-First Messaging Platform',
    summary: 'Introducing CGraph — a new communication platform combining end-to-end encrypted messaging with community features.',
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
    >
      {/* Press Kit Download */}
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-gray-800 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 p-8 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold text-white">Download Press Kit</h2>
            <p className="mb-6 text-gray-400">
              Get logos, brand guidelines, product screenshots, and everything you need for your story.
            </p>
            <a
              href="#"
              className="inline-flex rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-4 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40"
            >
              Download Press Kit (ZIP)
            </a>
          </motion.div>
        </div>
      </section>

      {/* Brand Assets */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Brand Assets</h2>
            <p className="mt-2 text-gray-400">Download individual assets for your coverage</p>
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
                className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-purple-500/50 hover:bg-gray-900"
              >
                <div className="mb-3 text-4xl">{asset.icon}</div>
                <h3 className="mb-1 font-semibold text-white">{asset.name}</h3>
                <p className="mb-3 text-sm text-gray-400">{asset.description}</p>
                <span className="text-xs text-purple-400">{asset.formats}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Company Facts */}
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Company Facts</h2>
            <p className="mt-2 text-gray-400">Key information about CGraph</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-xl border border-gray-800 bg-gray-900/50 p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {companyFacts.map((fact) => (
                <div key={fact.label} className="flex justify-between border-b border-gray-800 pb-3 last:border-0 sm:border-0 sm:pb-0">
                  <span className="text-gray-400">{fact.label}</span>
                  <span className="font-medium text-white">{fact.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Press Releases</h2>
            <p className="mt-2 text-gray-400">Recent announcements and news</p>
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
                className="group block rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-purple-500/50 hover:bg-gray-900"
              >
                <span className="text-sm text-purple-400">{release.date}</span>
                <h3 className="mt-2 text-lg font-semibold text-white group-hover:text-purple-300">
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
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">In the News</h2>
            <p className="mt-2 text-gray-400">Selected media coverage</p>
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
                className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-purple-500/50 hover:bg-gray-900"
              >
                <span className="text-sm font-medium text-purple-400">{article.outlet}</span>
                <h3 className="mt-2 font-semibold text-white group-hover:text-purple-300">
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
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-gray-800 bg-gray-950 p-8 text-center"
          >
            <h2 className="mb-4 text-xl font-bold text-white">Media Inquiries</h2>
            <p className="mb-6 text-gray-400">
              For interview requests, press inquiries, or additional information, please contact our media relations team.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:press@cgraph.org"
                className="inline-flex rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40"
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
