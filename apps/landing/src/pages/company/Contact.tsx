/**
 * Contact Page - Get in touch with CGraph
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const contactOptions = [
  {
    icon: '💬',
    title: 'General Inquiries',
    description: "Questions about CGraph? We'd love to hear from you.",
    email: 'hello@cgraph.org',
    response: '24-48 hours',
  },
  {
    icon: '🛡️',
    title: 'Security',
    description: 'Report security vulnerabilities or concerns.',
    email: 'security@cgraph.org',
    response: '< 24 hours',
    urgent: true,
  },
  {
    icon: '📰',
    title: 'Press & Media',
    description: 'Media inquiries, interview requests, and press kits.',
    email: 'press@cgraph.org',
    response: '24-48 hours',
  },
  {
    icon: '🤝',
    title: 'Partnerships',
    description: 'Business development and partnership opportunities.',
    email: 'partners@cgraph.org',
    response: '3-5 business days',
  },
  {
    icon: '🔒',
    title: 'Privacy',
    description: 'GDPR requests and privacy-related questions.',
    email: 'privacy@cgraph.org',
    response: '< 30 days',
  },
  {
    icon: '⚖️',
    title: 'Legal',
    description: 'Legal inquiries and compliance matters.',
    email: 'legal@cgraph.org',
    response: '5-7 business days',
  },
];

const topics = [
  'General Inquiry',
  'Bug Report',
  'Feature Request',
  'Account Issue',
  'Security Report',
  'Press/Media',
  'Partnership',
  'Privacy/GDPR',
  'Other',
];

const socialLinks = [
  { name: 'Twitter', url: 'https://twitter.com/cgraph', icon: '𝕏' },
  { name: 'GitHub', url: 'https://github.com/cgraph', icon: '⚡' },
  { name: 'Discord', url: 'https://discord.gg/cgraph', icon: '💬' },
  { name: 'LinkedIn', url: 'https://linkedin.com/company/cgraph', icon: '💼' },
  { name: 'Mastodon', url: 'https://mastodon.social/@cgraph', icon: '🐘' },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'General Inquiry',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                <span className="text-xl font-bold text-black">C</span>
              </div>
              <span className="text-lg font-semibold text-white">CGraph</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/about"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                About
              </Link>
              <a
                href="https://app.cgraph.org"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Open CGraph
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 pb-12 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-bold text-white md:text-5xl"
          >
            Get in Touch
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-2xl text-xl text-gray-400"
          >
            Have a question, suggestion, or just want to say hi? We're here to help.
          </motion.p>
        </div>
      </section>

      {/* Contact Options Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contactOptions.map((option, index) => (
              <motion.a
                key={option.title}
                href={`mailto:${option.email}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group rounded-2xl border p-6 transition-all ${
                  option.urgent
                    ? 'border-red-500/20 bg-red-500/10 hover:border-red-500/40'
                    : 'border-white/10 bg-white/5 hover:border-emerald-500/30'
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="text-3xl">{option.icon}</div>
                  {option.urgent && (
                    <span className="rounded bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400">
                      Priority
                    </span>
                  )}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-emerald-400">
                  {option.title}
                </h3>
                <p className="mb-4 text-sm text-gray-400">{option.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-400">{option.email}</span>
                  <span className="text-xs text-gray-500">~ {option.response}</span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Support */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-8"
            >
              <h2 className="mb-6 text-2xl font-bold text-white">Send Us a Message</h2>

              {submitted ? (
                <div className="py-12 text-center">
                  <div className="mb-4 text-5xl">✅</div>
                  <h3 className="mb-2 text-xl font-semibold text-white">Message Sent!</h3>
                  <p className="mb-6 text-gray-400">
                    Thanks for reaching out. We'll get back to you as soon as possible.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', topic: 'General Inquiry', message: '' });
                    }}
                    className="text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-medium text-gray-400"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-gray-400"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="topic" className="mb-2 block text-sm font-medium text-gray-400">
                      Topic
                    </label>
                    <select
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors focus:border-emerald-500 focus:outline-none"
                    >
                      {topics.map((topic) => (
                        <option key={topic} value={topic} className="bg-[#0a0a0f]">
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-medium text-gray-400"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Support & Social */}
            <div className="space-y-8">
              {/* Help Center */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-8"
              >
                <div className="mb-4 text-4xl">📚</div>
                <h3 className="mb-2 text-xl font-bold text-white">Help Center</h3>
                <p className="mb-4 text-gray-400">
                  Find answers to common questions, tutorials, and troubleshooting guides in our
                  comprehensive Help Center.
                </p>
                <a
                  href="https://help.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Visit Help Center →
                </a>
              </motion.div>

              {/* Community */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-8"
              >
                <div className="mb-4 text-4xl">👥</div>
                <h3 className="mb-2 text-xl font-bold text-white">Community</h3>
                <p className="mb-4 text-gray-400">
                  Join our community to get help from other users, share feedback, and stay updated
                  on the latest features.
                </p>
                <a
                  href="https://discord.gg/cgraph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Join Discord Community →
                </a>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-8"
              >
                <h3 className="mb-4 text-xl font-bold text-white">Follow Us</h3>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <span>{social.icon}</span>
                      <span className="text-sm">{social.name}</span>
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="bg-white/[0.02] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Our Locations</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mb-3 text-3xl">🇺🇸</div>
              <h3 className="mb-1 text-lg font-semibold text-white">San Francisco</h3>
              <p className="text-sm text-gray-400">Headquarters</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mb-3 text-3xl">🇬🇧</div>
              <h3 className="mb-1 text-lg font-semibold text-white">London</h3>
              <p className="text-sm text-gray-400">EMEA Office</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mb-3 text-3xl">🇸🇬</div>
              <h3 className="mb-1 text-lg font-semibold text-white">Singapore</h3>
              <p className="text-sm text-gray-400">APAC Office</p>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            We're a remote-first company with team members in 20+ countries.
          </p>
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
              <Link to="/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link to="/press" className="transition-colors hover:text-white">
                Press
              </Link>
            </div>
            <div className="text-sm text-gray-500">© 2026 CGraph. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
