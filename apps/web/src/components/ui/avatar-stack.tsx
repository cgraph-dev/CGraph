/**
 * AvatarStack Component
 *
 * Reusable overlapping avatar stack with stagger entrance animation.
 * Used for member lists, group previews, and online indicators.
 * Stacked avatars with spring physics.
 */

import { motion } from 'framer-motion';
import { springs } from '@/lib/animation-presets';

export interface AvatarStackUser {
  id: string;
  username?: string;
  avatarUrl?: string | null;
}

interface AvatarStackProps {
  users: AvatarStackUser[];
  /** Max visible avatars before showing +N overflow */
  max?: number;
  /** Avatar size in pixels */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show animated entrance */
  animated?: boolean;
  /** Optional label after avatars */
  label?: string;
  /** OnClick callback for the stack */
  onClick?: () => void;
}

const sizeMap = {
  xs: { px: 20, text: 'text-[7px]', overlap: '-ml-1.5', border: 'border', overflow: 'text-[9px]' },
  sm: { px: 24, text: 'text-[8px]', overlap: '-ml-2', border: 'border', overflow: 'text-[10px]' },
  md: { px: 32, text: 'text-xs', overlap: '-ml-2.5', border: 'border-2', overflow: 'text-xs' },
  lg: { px: 40, text: 'text-sm', overlap: '-ml-3', border: 'border-2', overflow: 'text-sm' },
} as const;

const gradients = [
  'from-primary-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
];

/**
 * unknown for the ui module.
 */
/**
 * Avatar Stack component.
 */
export function AvatarStack({
  users,
  max = 3,
  size = 'sm',
  animated = true,
  label,
  onClick,
}: AvatarStackProps) {
  const config = sizeMap[size];
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div
      className={`flex items-center gap-1.5 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-center">
        {visible.map((user, idx) => {
          const initial = (user.username || 'U').charAt(0).toUpperCase();
          const gradient = gradients[idx % gradients.length];

          const avatar = (
            <div
              className={`relative overflow-hidden rounded-full ${config.border} border-dark-900 bg-gradient-to-br ${gradient}`}
              style={{
                width: config.px,
                height: config.px,
                zIndex: max - idx,
              }}
              title={user.username || 'User'}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username || 'User'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center font-bold text-white ${config.text}`}
                >
                  {initial}
                </div>
              )}
            </div>
          );

          if (animated) {
            return (
              <motion.div
                key={user.id}
                className={idx > 0 ? config.overlap : ''}
                initial={{ scale: 0, x: -8 }}
                animate={{ scale: 1, x: 0 }}
                transition={springs.snappy}
              >
                {avatar}
              </motion.div>
            );
          }

          return (
            <div key={user.id} className={idx > 0 ? config.overlap : ''}>
              {avatar}
            </div>
          );
        })}
      </div>

      {overflow > 0 && (
        <motion.span
          className={`font-semibold text-gray-400 ${config.overflow}`}
          initial={animated ? { opacity: 0 } : undefined}
          animate={animated ? { opacity: 1 } : undefined}
          transition={animated ? { delay: max * 0.08 + 0.1 } : undefined}
        >
          +{overflow}
        </motion.span>
      )}

      {label && <span className="text-xs text-gray-500">{label}</span>}
    </div>
  );
}
