/**
 * ScrollTimeline Component
 * Scroll-driven timeline with animated items
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { TimelineItemProps, ScrollTimelineProps } from './types';

function TimelineItem({ title, description, icon, index }: TimelineItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className="relative flex gap-8"
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* Timeline line */}
      <div className="relative flex flex-col items-center">
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl ring-2 ring-emerald-500"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
        >
          {icon}
        </motion.div>
        <motion.div
          className="mt-4 h-24 w-0.5 bg-gradient-to-b from-emerald-500 to-transparent"
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ originY: 0 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 pb-12">
        <motion.h3
          className="mb-2 text-xl font-bold text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {title}
        </motion.h3>
        <motion.p
          className="text-gray-400"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
}

export function ScrollTimeline({ items, className = '' }: ScrollTimelineProps) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <TimelineItem key={index} {...item} index={index} />
      ))}
    </div>
  );
}
