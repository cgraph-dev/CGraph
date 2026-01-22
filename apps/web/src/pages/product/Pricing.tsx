/**
 * Pricing Page
 *
 * CGraph pricing plans and comparison.
 *
 * @since v0.9.3
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individuals and small communities',
    features: [
      'Up to 100 members',
      'Real-time messaging',
      'Basic forums',
      'Standard themes',
      '5GB storage',
      'Community support',
    ],
    cta: 'Get Started',
    ctaLink: '/register',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For growing communities that need more',
    features: [
      'Up to 1,000 members',
      'Everything in Free',
      'Custom themes',
      'Advanced moderation',
      '50GB storage',
      'Priority support',
      'Analytics dashboard',
      'Custom domain',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/register?plan=pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with specific needs',
    features: [
      'Unlimited members',
      'Everything in Pro',
      'SSO/SAML integration',
      'Dedicated support',
      'Unlimited storage',
      'SLA guarantee',
      'Custom integrations',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact?type=enterprise',
    popular: false,
  },
];

const faqs = [
  {
    question: 'Can I switch plans at any time?',
    answer:
      'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you get immediate access to new features. When downgrading, the change takes effect at the end of your billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and cryptocurrency (Bitcoin, Ethereum). Enterprise customers can also pay via invoice.',
  },
  {
    question: 'Is there a free trial for Pro?',
    answer:
      'Yes! Pro comes with a 14-day free trial. No credit card required. You can explore all Pro features before deciding to subscribe.',
  },
  {
    question: 'What happens to my data if I downgrade?',
    answer:
      "Your data is always safe. If you exceed storage limits after downgrading, you won't lose data, but you won't be able to upload new files until you're under the limit.",
  },
  {
    question: 'Do you offer discounts for non-profits?',
    answer:
      'Yes! Non-profit organizations, educational institutions, and open-source projects get 50% off any paid plan. Contact us to apply.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      "We offer a 30-day money-back guarantee. If you're not satisfied with CGraph Pro, contact us within 30 days for a full refund.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <MarketingLayout
      title="Simple, Transparent Pricing"
      subtitle="Choose the plan that's right for your community"
      eyebrow="Pricing"
    >
      {/* Pricing Cards */}
      <section className="marketing-section">
        <div className="marketing-section__container">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 lg:grid-cols-3"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={itemVariants}
                className={`relative rounded-2xl border p-8 transition-all hover:shadow-xl ${
                  plan.popular ? 'border-primary-500 ring-2 ring-primary-500/20' : ''
                }`}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: plan.popular ? undefined : 'var(--color-border)',
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {plan.name}
                  </h3>
                  <div className="mt-4">
                    <span className="text-5xl font-bold" style={{ color: 'var(--color-text)' }}>
                      {plan.price}
                    </span>
                    <span style={{ color: 'var(--color-gray)' }}>{plan.period}</span>
                  </div>
                  <p className="mt-2" style={{ color: 'var(--color-gray)' }}>
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <span className="text-primary-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.ctaLink}
                  className={`mt-8 block w-full rounded-lg py-3 text-center font-semibold transition-all ${
                    plan.popular
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'border hover:bg-white/5'
                  }`}
                  style={
                    plan.popular
                      ? {}
                      : { borderColor: 'var(--color-border)', color: 'var(--color-text)' }
                  }
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="marketing-section__title font-zentry">Compare Plans</h2>
            <p className="mt-4" style={{ color: 'var(--color-gray)' }}>
              All plans include core features. Upgrade for more power.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 overflow-x-auto"
          >
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ borderColor: 'var(--color-border)' }}>
                  <th
                    className="border-b p-4 text-left font-semibold"
                    style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  >
                    Feature
                  </th>
                  <th
                    className="border-b p-4 text-center font-semibold"
                    style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  >
                    Free
                  </th>
                  <th
                    className="border-b p-4 text-center font-semibold"
                    style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  >
                    Pro
                  </th>
                  <th
                    className="border-b p-4 text-center font-semibold"
                    style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  >
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Members', '100', '1,000', 'Unlimited'],
                  ['Storage', '5GB', '50GB', 'Unlimited'],
                  ['Real-time Messaging', '✓', '✓', '✓'],
                  ['Forums', '✓', '✓', '✓'],
                  ['Custom Themes', '—', '✓', '✓'],
                  ['Analytics', '—', '✓', '✓'],
                  ['Custom Domain', '—', '✓', '✓'],
                  ['API Access', '—', '✓', '✓'],
                  ['SSO/SAML', '—', '—', '✓'],
                  ['SLA', '—', '—', '✓'],
                  ['Support', 'Community', 'Priority', 'Dedicated'],
                ].map(([feature, free, pro, enterprise]) => (
                  <tr key={feature} style={{ borderColor: 'var(--color-border)' }}>
                    <td
                      className="border-b p-4"
                      style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                    >
                      {feature}
                    </td>
                    <td
                      className="border-b p-4 text-center"
                      style={{ color: 'var(--color-gray)', borderColor: 'var(--color-border)' }}
                    >
                      {free}
                    </td>
                    <td
                      className="border-b p-4 text-center"
                      style={{ color: 'var(--color-gray)', borderColor: 'var(--color-border)' }}
                    >
                      {pro}
                    </td>
                    <td
                      className="border-b p-4 text-center"
                      style={{ color: 'var(--color-gray)', borderColor: 'var(--color-border)' }}
                    >
                      {enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="marketing-section">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="marketing-section__title font-zentry">Frequently Asked Questions</h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto mt-12 max-w-3xl space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                variants={itemVariants}
                className="overflow-hidden rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-4 text-left font-semibold transition-colors hover:bg-white/5"
                  style={{ color: 'var(--color-text)' }}
                >
                  {faq.question}
                  <span className={`transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {openFaq === index && (
                  <div className="border-t p-4" style={{ borderColor: 'var(--color-border)' }}>
                    <p style={{ color: 'var(--color-gray)' }}>{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="marketing-section__title font-zentry">Still have questions?</h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--color-gray)' }}>
              Our team is here to help you find the right plan.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="rounded-lg bg-primary-500 px-8 py-3 font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg"
              >
                Contact Sales
              </Link>
              <Link
                to="/register"
                className="rounded-lg border px-8 py-3 font-semibold transition-all hover:bg-white/5"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Start Free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
