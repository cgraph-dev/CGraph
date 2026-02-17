/**
 * FeaturesSidebar Component
 * Features list and CTA sidebar
 */

import { motion } from 'framer-motion';
import { features } from './constants';
import { ForumNeonIcon } from './ForumNeonIcon';
import { LandingButton } from '../marketing/ui/LandingButton';
import { WEB_APP_URL } from '@/constants';

export function FeaturesSidebar() {
  return (
    <motion.div
      className="sticky top-24 space-y-4"
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
    >
      <h3 className="text-lg font-semibold text-white">Revolutionary Features</h3>

      <div className="space-y-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition-colors hover:border-emerald-500/30"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <ForumNeonIcon variant={feature.icon} className="h-6 w-6" />
            <div>
              <h4 className="font-medium text-white">{feature.title}</h4>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-purple-500/10 p-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <h4 className="mb-2 font-semibold text-white">Ready to build your community?</h4>
        <p className="mb-4 text-sm text-gray-400">Create your first forum in minutes</p>
        <LandingButton
          variant="primary"
          href={`${WEB_APP_URL}/register`}
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          }
        >
          Get Started Free
        </LandingButton>
      </motion.div>
    </motion.div>
  );
}
