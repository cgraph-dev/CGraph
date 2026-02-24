/**
 * AnimatedOutlet Component
 *
 * Wraps React Router's Outlet with Framer Motion AnimatePresence
 * for smooth page transitions (fade + subtle slide).
 *
 * @module layouts/app-layout/AnimatedOutlet
 */

import { useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tweens } from '@/lib/animation-presets';

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

const pageTransition = {
  enter: { duration: 0.15, ease: tweens.quickFade.ease },
  exit: { duration: 0.1, ease: 'easeIn' as const },
};

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="flex flex-1 overflow-hidden"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition.enter}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
