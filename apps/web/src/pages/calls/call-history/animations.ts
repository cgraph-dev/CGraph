/**
 * Call history page animation definitions.
 * @module
 */
import { durations } from '@cgraph/animation-constants';
import type { Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: durations.normal.ms / 1000 } },
};
