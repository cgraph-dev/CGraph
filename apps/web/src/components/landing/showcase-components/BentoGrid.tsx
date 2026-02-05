/**
 * BentoGrid Component
 * Feature bento grid with animated cards
 */

import { motion } from 'framer-motion';
import type { BentoGridProps } from './types';

export function BentoGrid({ items, className = '' }: BentoGridProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-3 ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          className={`group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/50 ${
            item.span === 'wide' ? 'md:col-span-2' : item.span === 'tall' ? 'md:row-span-2' : ''
          }`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at center, ${item.color}20, transparent 70%)`,
            }}
          />

          <motion.span
            className="mb-4 block text-4xl"
            whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {item.icon}
          </motion.span>

          <h3 className="relative z-10 mb-2 text-lg font-semibold text-white">{item.title}</h3>
          <p className="relative z-10 text-sm text-gray-400">{item.description}</p>

          {/* Animated border on hover */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-500 to-cyan-500"
            whileHover={{ width: '100%' }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      ))}
    </div>
  );
}
