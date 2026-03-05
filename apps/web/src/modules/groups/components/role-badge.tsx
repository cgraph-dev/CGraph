/**
 * Role Badge — Colored pill with role dot + name
 *
 * Used in member lists, profile headers, user cards.
 * Hover shows role permissions summary.
 * Sizes: sm (member list), md (profile).
 *
 * @module modules/groups/components/role-badge
 */

import { motion } from 'motion/react';
import Tooltip from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface RoleBadgeProps {
  /** Role display name */
  name: string;
  /** Role color hex (e.g. "#e91e63") */
  color: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Optional permissions summary shown on hover */
  permissions?: string[];
  className?: string;
}

// ── Size Config ────────────────────────────────────────────────────────

const sizeStyles = {
  sm: {
    container: 'px-1.5 py-0.5 text-[10px] gap-1',
    dot: 'h-2 w-2',
  },
  md: {
    container: 'px-2 py-1 text-xs gap-1.5',
    dot: 'h-2.5 w-2.5',
  },
} as const;

// ── Component ──────────────────────────────────────────────────────────

export function RoleBadge({
  name,
  color,
  size = 'sm',
  permissions,
  className,
}: RoleBadgeProps) {
  const styles = sizeStyles[size];

  const badge = (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        styles.container,
        className,
      )}
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {/* Color dot */}
      <div
        className={cn('rounded-full', styles.dot)}
        style={{ backgroundColor: color }}
      />
      <span>{name}</span>
    </motion.div>
  );

  if (permissions && permissions.length > 0) {
    return (
      <Tooltip content={name} side="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
}

export default RoleBadge;
