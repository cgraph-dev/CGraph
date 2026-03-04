/**
 * Contact Page
 *
 * Contact information and support options.
 *
 * @since v0.9.2
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LiquidGlassLayout } from '@/components/liquid-glass';

const contactMethods = [
  {
    icon: '📧',
    title: 'Email Support',
    description: 'For general inquiries and support requests',
    contact: 'support@cgraph.org',
    link: 'mailto:support@cgraph.org',
  },
  {
    icon: '🔒',
    title: 'Security Issues',
    description: 'Report vulnerabilities responsibly',
    contact: 'security@cgraph.org',
    link: 'mailto:security@cgraph.org',
  },
  {
    icon: '💡',
    title: 'Feedback',
    description: 'Product feedback and suggestions',
    contact: 'hello@cgraph.org',
    link: 'mailto:hello@cgraph.org',
  },
  {
    icon: '📰',
    title: 'Press & Media',
    description: 'Press inquiries and interview requests',
    contact: 'press@cgraph.org',
    link: 'mailto:press@cgraph.org',
  },
  {
    icon: '⚖️',
    title: 'Legal',
    description: 'Legal matters and compliance',
    contact: 'legal@cgraph.org',
    link: 'mailto:legal@cgraph.org',
  },
  {
    icon: '🔐',
    title: 'Privacy / DPO',
    description: 'Data protection and GDPR requests',
    contact: 'dpo@cgraph.org',
    link: 'mailto:dpo@cgraph.org',
  },
];

const faqItems = [
  {
    question: 'How quickly can I expect a response?',
    answer:
      'We typically respond within 24-48 hours for general inquiries. Security issues are prioritized and addressed as quickly as possible.',
  },
  {
    question: 'Is there phone support available?',
    answer:
      'We currently do not offer phone support to ensure the security and privacy of all communications. Email and in-app support allow us to properly verify identities and maintain audit trails.',
  },
  {
    question: 'How do I report a security vulnerability?',
    answer:
      'Please email security@cgraph.org with details of the vulnerability. We follow responsible disclosure practices. Do not disclose vulnerabilities publicly before they are resolved.',
  },
  {
    question: 'Can I request my data or delete my account?',
    answer:
      'Yes! You can download your data or delete your account directly from Settings → Privacy. For assistance, contact privacy@cgraph.org. We respond to GDPR requests within 30 days.',
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In production, this would send to the backend
    setSubmitStatus('success');
    setIsSubmitting(false);
  };

  return (
    <LiquidGlassLayout
      title="Contact Us"
      subtitle="We'd love to hear from you"
      maxWidth="max-w-5xl"
    >
      {/* Contact Methods */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900">Reach Out Directly</h2>
              <p className="mt-3 text-lg text-slate-500">Choose the best channel for your needs</p>
            </motion.div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.title}
                href={method.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-surface rounded-xl p-5 shadow-glass transition-shadow hover:shadow-glass-lg"
                style={{ textDecoration: 'none' }}
              >
                <span className="mb-3 block text-3xl">{method.icon}</span>
                <h3 className="text-lg font-semibold text-slate-900">{method.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{method.description}</p>
                <span className="mt-3 block text-sm font-medium text-purple-600">
                  {method.contact}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900">Send Us a Message</h2>
              <p className="mt-3 text-lg text-slate-500">
                Fill out the form below and we'll get back to you
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {submitStatus === 'success' ? (
              <div className="glass-surface rounded-2xl border border-purple-200 bg-purple-50/50 p-6 text-center shadow-glass">
                <span className="mb-3 block text-3xl">✅</span>
                <h3 className="text-lg font-semibold text-slate-900">Message Sent!</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Thank you for reaching out. We'll get back to you within 24-48 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitStatus('idle');
                    setFormData({ name: '', email: '', subject: 'general', message: '' });
                  }}
                  className="mt-6 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="glass-surface space-y-5 rounded-2xl p-6 shadow-glass"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 text-slate-800 outline-none backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-purple-300/70 focus:shadow-[0_0_0_3px_rgba(196,181,253,0.3)]"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 text-slate-800 outline-none backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-purple-300/70 focus:shadow-[0_0_0_3px_rgba(196,181,253,0.3)]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full cursor-pointer rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 text-slate-800 outline-none backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-purple-300/70 focus:shadow-[0_0_0_3px_rgba(196,181,253,0.3)]"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Product Feedback</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 text-slate-800 outline-none backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-purple-300/70 focus:shadow-[0_0_0_3px_rgba(196,181,253,0.3)]"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-purple-500 px-6 py-3 font-medium text-white shadow-glass transition-colors hover:bg-purple-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            </motion.div>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-surface rounded-2xl p-6 shadow-glass"
              >
                <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-sm text-slate-500">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-slate-900">Join Our Community</h2>
            <p className="mb-8 mt-3 text-lg text-slate-500">Connect with other CGraph users</p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://web.cgraph.org/forum"
                rel="noopener noreferrer"
                className="glass-surface inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 shadow-glass transition-shadow hover:shadow-glass-lg"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
                Community Forum
              </a>
              <a
                href="https://twitter.com/cgraph"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-surface inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 shadow-glass transition-shadow hover:shadow-glass-lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                @cgraph
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </LiquidGlassLayout>
  );
}
