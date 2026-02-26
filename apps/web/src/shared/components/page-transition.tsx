/**
 * Page Transition Wrapper
 *
 * Provides subtle fade + slide transitions on route changes.
 * Wraps page content with AnimatePresence-driven motion.
 *
 * @module shared/components/PageTransition
 */

import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { tweens } from '@/lib/animation-presets';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const PAGE_TRANSITION = tweens.fast;

interface PageTransitionProps {
  readonly children: React.ReactNode;
}

/**
 * Wraps its children with a route-keyed Framer Motion transition.
 * Uses pathname as the motion key for clean re-renders on navigation.
 */
export function PageTransition({ children }: PageTransitionProps): React.ReactElement {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PAGE_TRANSITION}
    >
      {children}
    </motion.div>
  );
}
