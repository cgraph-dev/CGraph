/**
 * FAQ Section Component
 *
 * Displays frequently asked questions about premium subscriptions.
 */

import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { FAQ_ITEMS } from './constants';

export function FAQSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-16"
    >
      <h2 className="mb-8 text-center text-2xl font-bold text-white">Frequently Asked Questions</h2>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {FAQ_ITEMS.map((faq, index) => (
          <GlassCard key={index} variant="frosted" className="p-6">
            <h3 className="mb-2 font-semibold text-white">{faq.q}</h3>
            <p className="text-sm text-gray-400">{faq.a}</p>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
}
