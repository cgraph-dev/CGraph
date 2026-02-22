/**
 * Feature Comparison Table Component
 *
 * Displays a side-by-side comparison of features across all premium tiers.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { PREMIUM_TIERS } from './constants';

interface FeatureComparisonTableProps {
  isVisible: boolean;
}

export function FeatureComparisonTable({ isVisible }: FeatureComparisonTableProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <GlassCard variant="frosted" className="overflow-x-auto p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-4 py-4 text-left font-medium text-gray-400">Feature</th>
                  {PREMIUM_TIERS.map((tier) => (
                    <th key={tier.id} className="px-4 py-4 text-center">
                      <span
                        className={`font-bold ${tier.popular ? 'text-primary-400' : 'text-white'}`}
                      >
                        {tier.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(PREMIUM_TIERS[0]?.features ?? []).map((feature, index) => (
                  <tr key={index} className="border-b border-dark-800">
                    <td className="px-4 py-4 text-gray-300">{feature.name}</td>
                    {PREMIUM_TIERS.map((tier) => {
                      const tierFeature = tier.features[index];
                      return (
                        <td key={tier.id} className="px-4 py-4 text-center">
                          {tierFeature?.included ? (
                            <CheckIcon className="mx-auto h-5 w-5 text-green-400" />
                          ) : (
                            <XMarkIcon className="mx-auto h-5 w-5 text-gray-600" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
