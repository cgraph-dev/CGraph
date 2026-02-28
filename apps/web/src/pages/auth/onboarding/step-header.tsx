/**
 * StepHeader component - animated step title and icon
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ONBOARDING_STEPS } from './constants';
import { springs } from '@/lib/animation-presets';

interface StepHeaderProps {
  currentStep: number;
}

/**
 * unknown for the auth module.
 */
/**
 * Step Header component.
 */
export function StepHeader({ currentStep }: StepHeaderProps) {
  const step = ONBOARDING_STEPS[currentStep - 1];

  return (
    <div className="mb-8 text-center">
      <motion.div
        key={`icon-${currentStep}`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={springs.wobbly}
        className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white"
      >
        {step?.icon}
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`header-${currentStep}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <h2 className="text-2xl font-bold text-foreground">{step?.title}</h2>
          <p className="mt-2 text-foreground-muted">{step?.description}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
