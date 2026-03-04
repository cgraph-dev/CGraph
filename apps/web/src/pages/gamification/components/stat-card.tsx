/**
 * Stat card component for the Gamification Hub.
 */

import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  gradient: string;
  delay?: number;
}

/**
 * unknown for the gamification module.
 */
/**
 * Stat Card display component.
 */
export function StatCard({ icon, label, value, subtext, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard className="h-full p-4">
        <div className="flex items-start justify-between">
          <div className={`rounded-xl bg-gradient-to-br p-2 ${gradient}`}>{icon}</div>
          {subtext && <span className="text-xs text-gray-500">{subtext}</span>}
        </div>
        <p className="mt-3 text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </GlassCard>
    </motion.div>
  );
}
