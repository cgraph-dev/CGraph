/**
 * AnimatedOutlet Component
 *
 * Wraps React Router's Outlet with a fast fade-in on route change.
 * No exit animation — instant swap avoids the "flash" feeling.
 *
 * @module layouts/app-layout/AnimatedOutlet
 */

import { useLocation, useOutlet } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const pageTransition = {
  duration: 0.15,
  ease: 'easeOut',
};

const instantTransition = { duration: 0 };

/**
 * unknown.
 */
/**
 * Animated Outlet component.
 */
export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      key={location.pathname}
      className="flex flex-1 overflow-hidden"
      variants={pageVariants}
      initial={prefersReducedMotion ? false : 'initial'}
      animate="animate"
      transition={prefersReducedMotion ? instantTransition : pageTransition}
    >
      {outlet}
    </motion.div>
  );
}
