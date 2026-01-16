/**
 * Contact Page
 * 
 * Contact information and support options.
 * 
 * @since v0.9.2
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

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
    icon: '🏢',
    title: 'Enterprise Sales',
    description: 'Custom solutions for organizations',
    contact: 'sales@cgraph.org',
    link: 'mailto:sales@cgraph.org',
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
    answer: 'We typically respond within 24-48 hours for general inquiries. Security issues are prioritized and addressed within 24 hours. Enterprise customers receive priority support with faster response times.',
  },
  {
    question: 'Is there phone support available?',
    answer: 'We currently do not offer phone support to ensure the security and privacy of all communications. Email and in-app support allow us to properly verify identities and maintain audit trails.',
  },
  {
    question: 'How do I report a security vulnerability?',
    answer: 'Please email security@cgraph.org with details of the vulnerability. We follow responsible disclosure practices and offer a bug bounty program for valid security findings. Do not disclose vulnerabilities publicly before they are resolved.',
  },
  {
    question: 'Can I request my data or delete my account?',
    answer: 'Yes! You can download your data or delete your account directly from Settings → Privacy. For assistance, contact privacy@cgraph.org. We respond to GDPR requests within 30 days.',
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would send to the backend
    setSubmitStatus('success');
    setIsSubmitting(false);
  };

  return (
    <MarketingLayout
      title="Contact Us"
      subtitle="We'd love to hear from you. Get in touch with our team."
    >
      {/* Contact Methods */}
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Reach Out Directly</h2>
            <p className="mt-2 text-gray-400">Choose the best channel for your needs</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.title}
                href={method.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-purple-500/50 hover:bg-gray-900"
              >
                <div className="mb-3 text-3xl">{method.icon}</div>
                <h3 className="mb-1 text-lg font-semibold text-white">{method.title}</h3>
                <p className="mb-3 text-sm text-gray-400">{method.description}</p>
                <span className="text-purple-400 group-hover:text-purple-300">{method.contact}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Send Us a Message</h2>
            <p className="mt-2 text-gray-400">Fill out the form below and we'll get back to you</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {submitStatus === 'success' ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
                <div className="mb-4 text-5xl">✅</div>
                <h3 className="mb-2 text-xl font-semibold text-white">Message Sent!</h3>
                <p className="text-gray-400">
                  Thank you for reaching out. We'll get back to you within 24-48 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitStatus('idle');
                    setFormData({ name: '', email: '', subject: 'general', message: '' });
                  }}
                  className="mt-6 text-purple-400 hover:text-purple-300"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-300">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-300">
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="enterprise">Enterprise Sales</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Product Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-300">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
              >
                <h3 className="mb-2 font-semibold text-white">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">Join Our Community</h2>
            <p className="mb-8 text-gray-400">Connect with other CGraph users</p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/forum"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 text-white transition-all hover:border-purple-500/50 hover:bg-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                Community Forum
              </a>
              <a
                href="https://twitter.com/cgraph_org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 text-white transition-all hover:border-purple-500/50 hover:bg-gray-700"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                Twitter
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
