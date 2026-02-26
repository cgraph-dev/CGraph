/**
 * RoleBadge component
 * @module modules/forums/components/forum-theme-renderer
 */

import { durations } from '@cgraph/animation-constants';
import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RoleBadgeProps } from './types';
import { SIZE_CLASSES } from './constants';

export const RoleBadge = memo(function RoleBadge({ role, size = 'md', className }: RoleBadgeProps) {
  const getBadgeStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      color: role.color,
    };

    if (role.glowEffect) {
      base.boxShadow = `0 0 8px ${role.color}40, 0 0 16px ${role.color}20`;
    }

    switch (role.badgeStyle) {
      case 'pill':
        return { ...base, borderRadius: '9999px', border: `1px solid ${role.color}` };
      case 'shield':
        return {
          ...base,
          borderRadius: '4px 4px 50% 50%',
          border: `2px solid ${role.color}`,
          paddingBottom: '0.75rem',
        };
      case 'crown':
        return { ...base, borderRadius: '4px', border: `2px solid ${role.color}` };
      case 'star':
        return { ...base, borderRadius: '4px', border: `1px solid ${role.color}` };
      case 'diamond':
        return {
          ...base,
          borderRadius: '4px',
          border: `2px solid ${role.color}`,
          background: `linear-gradient(135deg, ${role.color}20, transparent)`,
        };
      default:
        return base;
    }
  };

  const getAnimationProps = () => {
    switch (role.animation) {
      case 'pulse':
        return {
          animate: { scale: [1, 1.05, 1], opacity: [1, 0.9, 1] },
          transition: { duration: durations.loop.ms / 1000, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'shimmer':
        return {
          animate: { backgroundPosition: ['200% 0', '-200% 0'] },
          transition: { duration: durations.cinematic.ms / 1000, repeat: Infinity, ease: 'linear' },
        };
      case 'rainbow':
        return {
          animate: {
            borderColor: [
              '#ff0000',
              '#ff7f00',
              '#ffff00',
              '#00ff00',
              '#0000ff',
              '#8b00ff',
              '#ff0000',
            ],
          },
          transition: { duration: 4, repeat: Infinity, ease: 'linear' },
        };
      default:
        return {};
    }
  };

  return (
    <motion.span
      className={cn('inline-flex items-center gap-1 font-medium', SIZE_CLASSES[size], className)}
      style={getBadgeStyles()}
       
      {...(getAnimationProps() as Record<string, unknown>)} // safe downcast – structural boundary
    >
      {role.badgeIcon && <span className="text-current">{role.badgeIcon}</span>}
      {role.name}
    </motion.span>
  );
});
