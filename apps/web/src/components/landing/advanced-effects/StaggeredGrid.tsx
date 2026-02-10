/**
 * StaggeredGrid Component
 * Grid with staggered animation reveal
 */

import { motion, type Variants } from 'framer-motion';
import { GRID_DEFAULT_COLUMNS, GRID_DEFAULT_STAGGER_DELAY } from './constants';
import type { StaggeredGridProps } from './types';
import { springs } from '@/lib/animation-presets/presets';

export function StaggeredGrid({
  children,
  className = '',
  columns = GRID_DEFAULT_COLUMNS,
  staggerDelay = GRID_DEFAULT_STAGGER_DELAY,
}: StaggeredGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: springs.dramatic,
    },
  };

  return (
    <motion.div
      className={`grid gap-6 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
