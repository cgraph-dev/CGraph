/**
 * Quick link navigation card for the Gamification Hub.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

export interface QuickLinkProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}

export function QuickLink({ to, icon, title, description, gradient, delay = 0 }: QuickLinkProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        navigate(to);
        HapticFeedback.medium();
      }}
      className="cursor-pointer"
    >
      <GlassCard variant="holographic" className="group flex items-center gap-4 p-4">
        <div
          className={`rounded-xl bg-gradient-to-br p-3 ${gradient} transition-transform group-hover:scale-110`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white transition-colors group-hover:text-primary-300">
            {title}
          </h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <ArrowRightIcon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-white" />
      </GlassCard>
    </motion.div>
  );
}
