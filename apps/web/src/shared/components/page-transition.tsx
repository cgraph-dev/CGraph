/**
 * Page Transition Wrapper
 *
 * Provides subtle fade + slide transitions on route changes.
 * Wraps page content with AnimatePresence-driven motion.
 * Uses shared animation tokens from @cgraph/animation-constants.
 *
 * @module shared/components/PageTransition
 */

import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { transitions } from '@cgraph/animation-constants';

const PAGE_VARIANTS = {
  initial: transitions.pageEnter.initial,
  animate: transitions.pageEnter.animate,
  exit: transitions.pageEnter.exit,
};

const PAGE_TRANSITION = transitions.pageEnter.transition;

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
