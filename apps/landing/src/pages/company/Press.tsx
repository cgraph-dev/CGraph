/**
 * Press Page - Media resources and press releases
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Navigation } from '../../components/Navigation';

const pressReleases = [
  {
    date: 'January 15, 2026',
    title: 'CGraph Launches Enterprise Version with Advanced Admin Controls',
    description:
      'New enterprise offering brings end-to-end encryption and advanced admin controls to business communication.',
    category: 'Product',
  },
  {
    date: 'December 1, 2025',
    title: 'CGraph Reaches 50,000 Active Users',
    description: 'Privacy-focused messaging platform sees rapid growth since public launch.',
    category: 'Milestone',
  },
  {
    date: 'October 15, 2025',
    title: 'CGraph Completes SOC 2 Type II Certification',
    description: 'Third-party audit confirms CGraph meets highest security standards.',
    category: 'Security',
  },
  {
    date: 'August 1, 2025',
    title: 'CGraph Mobile Apps Launch on iOS and Android',
    description: 'Native mobile apps bring end-to-end encrypted messaging to iOS and Android.',
    category: 'Product',
  },
  {
    date: 'June 1, 2025',
    title: 'CGraph Announces Public Launch',
    description: 'After 18 months of beta testing, CGraph opens to the public.',
    category: 'Milestone',
  },
  {
    date: 'March 15, 2025',
    title: 'CGraph Passes Independent Security Audit',
    description: 'Cryptography experts confirm security of end-to-end encryption implementation.',
    category: 'Security',
  },
];

const brandAssets = [
  {
    title: 'Logo Pack',
    description: 'Primary and secondary logos in various formats (SVG, PNG, AI)',
    type: 'Logos',
    size: '2.4 MB',
  },
  {
    title: 'Brand Guidelines',
    description: 'Complete brand guidelines including colors, typography, and usage',
    type: 'PDF',
    size: '8.1 MB',
  },
  {
    title: 'Product Screenshots',
    description: 'High-resolution screenshots of key features and interfaces',
    type: 'Images',
    size: '15.2 MB',
  },
  {
    title: 'Executive Bios & Photos',
    description: 'Bios and headshots of CGraph leadership team',
    type: 'Media Kit',
    size: '4.7 MB',
  },
];

const pressContacts = [
  {
    name: 'Media Inquiries',
    email: 'press@cgraph.org',
    response: 'Same day for urgent requests',
  },
  {
    name: 'Speaking Requests',
    email: 'speakers@cgraph.org',
    response: '3-5 business days',
  },
];

// What people are saying about CGraph - community feedback
const communityFeedback = [
  { source: 'Beta Tester', quote: 'Finally, a messaging app that takes privacy seriously.' },
  { source: 'Early Adopter', quote: "The encryption is seamless - you don't even notice it." },
  { source: 'Security Researcher', quote: 'Solid implementation of end-to-end encryption.' },
  { source: 'Community Member', quote: 'Great design with privacy at its core.' },
  { source: 'Power User', quote: 'Fast, secure, and actually enjoyable to use.' },
];

const stats = [
  { label: 'Active Users', value: '50K+' },
  { label: 'Countries', value: '40+' },
  { label: 'Messages/Day', value: '1M+' },
  { label: 'Uptime', value: '99.9%' },
];

export default function Press() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Shared Navigation Component */}
      <Navigation transparent />

      {/* Hero Section */}
      <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400"
              >
                📰 Press & Media
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 text-4xl font-bold text-white md:text-5xl"
              >
                CGraph Newsroom
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 text-xl text-gray-400"
              >
                Find the latest news, press releases, brand assets, and media resources for CGraph.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4"
              >
                <a
                  href="mailto:press@cgraph.org"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
                >
                  Contact Press Team
                </a>
                <a
                  href="#assets"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Download Assets
                </a>
              </motion.div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 blur-3xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="rounded-xl border border-white/10 bg-white/5 p-6 text-center"
                    >
                      <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="bg-white/[0.02] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">Press Releases</h2>
            <a
              href="#"
              className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              View All →
            </a>
          </div>
          <div className="grid gap-6">
            {pressReleases.map((release, index) => (
              <motion.a
                key={release.title}
                href="#"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-emerald-500/30 hover:bg-white/10"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-sm text-gray-500">{release.date}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          release.category === 'Product'
                            ? 'bg-blue-500/20 text-blue-400'
                            : release.category === 'Milestone'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {release.category}
                      </span>
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-white transition-colors group-hover:text-emerald-400">
                      {release.title}
                    </h3>
                    <p className="text-sm text-gray-400">{release.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-gray-500 transition-colors group-hover:text-emerald-400">
                      Read More →
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Assets */}
      <section id="assets" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Brand Assets</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              Download official CGraph logos, screenshots, and brand guidelines for media use.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {brandAssets.map((asset, index) => (
              <motion.div
                key={asset.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-2xl">
                        {asset.type === 'Logos'
                          ? '🎨'
                          : asset.type === 'PDF'
                            ? '📄'
                            : asset.type === 'Images'
                              ? '🖼️'
                              : '📦'}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{asset.title}</h3>
                    </div>
                    <p className="mb-3 text-sm text-gray-400">{asset.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{asset.type}</span>
                      <span>•</span>
                      <span>{asset.size}</span>
                    </div>
                  </div>
                  <button className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white">
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 font-medium text-white transition-colors hover:bg-white/20"
            >
              Download Complete Press Kit (28.4 MB)
            </a>
          </div>
        </div>
      </section>

      {/* Community Feedback */}
      <section className="bg-gradient-to-br from-emerald-500/5 to-blue-500/5 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">What Our Users Say</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {communityFeedback.map((feedback, index) => (
              <motion.div
                key={feedback.source}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-4 text-3xl text-emerald-400/50">"</div>
                <p className="mb-4 text-lg italic text-white">{feedback.quote}</p>
                <div className="font-medium text-gray-400">— {feedback.source}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Contacts */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Press Contacts</h2>
            <p className="text-gray-400">
              For media inquiries, please reach out to our press team.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {pressContacts.map((contact) => (
              <a
                key={contact.name}
                href={`mailto:${contact.email}`}
                className="rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-emerald-500/30 hover:bg-white/10"
              >
                <h3 className="mb-2 text-lg font-semibold text-white">{contact.name}</h3>
                <div className="mb-2 text-emerald-400">{contact.email}</div>
                <div className="text-sm text-gray-500">Response time: {contact.response}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white/[0.02] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
            Want to Write About CGraph?
          </h2>
          <p className="mb-8 text-gray-400">
            We'd love to help. Get in touch with our press team for interviews, demos, or additional
            information.
          </p>
          <a
            href="mailto:press@cgraph.org"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          >
            Contact Press Team
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                <span className="text-xl font-bold text-black">C</span>
              </div>
              <span className="font-semibold text-white">CGraph</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <Link to="/about" className="transition-colors hover:text-white">
                About
              </Link>
              <Link to="/careers" className="transition-colors hover:text-white">
                Careers
              </Link>
              <Link to="/contact" className="transition-colors hover:text-white">
                Contact
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
            </div>
            <div className="text-sm text-gray-500">© 2026 CGraph. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
