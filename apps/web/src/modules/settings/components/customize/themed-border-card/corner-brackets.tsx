/**
 * CornerBrackets Component
 *
 * Animated corner brackets for selected state
 */

import { motion } from 'motion/react';

interface CornerBracketsProps {
  color: string;
}

/**
 * unknown for the settings module.
 */
/**
 * Corner Brackets component.
 */
export function CornerBrackets({ color }: CornerBracketsProps) {
  return (
    <>
      <motion.div
        className="absolute left-0 top-0 h-3 w-3 rounded-tl-lg border-l-2 border-t-2"
        style={{ borderColor: color }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
      />
      <motion.div
        className="absolute right-0 top-0 h-3 w-3 rounded-tr-lg border-r-2 border-t-2"
        style={{ borderColor: color }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-3 w-3 rounded-bl-lg border-b-2 border-l-2"
        style={{ borderColor: color }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      />
      <motion.div
        className="absolute bottom-0 right-0 h-3 w-3 rounded-br-lg border-b-2 border-r-2"
        style={{ borderColor: color }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      />
    </>
  );
}
