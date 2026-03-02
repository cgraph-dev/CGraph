/**
 * Animation variants for email verification page.
 *
 * @module pages/auth/verify-email/animations
 */

import { durations } from '@cgraph/animation-constants';

export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slower.ms / 1000, staggerChildren: 0.1 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
