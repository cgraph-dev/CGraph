/**
 * ThreadPrefix Component
 * Displays colored prefix badges on thread titles (e.g., [SOLVED], [HELP], [BUG])
 */

import { motion } from 'framer-motion';
import type { ThreadPrefix as ThreadPrefixType } from '@/stores/forumStore';

interface ThreadPrefixProps {
  prefix: ThreadPrefixType | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ThreadPrefix({ prefix, size = 'md', className = '' }: ThreadPrefixProps) {
  if (!prefix) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center rounded-md font-semibold
        transition-all duration-200
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        backgroundColor: `${prefix.color}20`,
        color: prefix.color,
        border: `1px solid ${prefix.color}40`,
      }}
    >
      {prefix.name}
    </motion.span>
  );
}
