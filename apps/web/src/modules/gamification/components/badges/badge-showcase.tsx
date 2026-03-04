/**
 * BadgeShowcase Component
 *
 * Displays a user's equipped badges in a visually stunning showcase.
 * Users can equip up to 5 badges that represent their identity.
 *
 * Features:
 * - 5 badge slots with animated backgrounds
 * - Empty slot placeholders with add functionality
 * - Drag and drop reordering (future)
 * - Cross-forum visibility — badges follow user everywhere
 *
 * @module gamification/components/badges/BadgeShowcase
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlusIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { AnimatedBadgeWithTooltip } from './animated-badge';
import { BadgePickerModal } from './badge-picker-modal';
import type { Achievement } from '@/modules/gamification/store';
import { springs } from '@/lib/animation-presets';

// Re-export extracted components for backwards compatibility
export { CompactBadgeShowcase } from './compact-badge-showcase';
export type { CompactBadgeShowcaseProps } from './compact-badge-showcase';

// ── Type definitions ──────────────────────────────────────────────────

export interface BadgeShowcaseProps {
  /** Array of equipped achievements (max 5) */
  equippedBadges: Achievement[];
  /** All available unlocked achievements */
  availableBadges?: Achievement[];
  /** Callback when badge is equipped */
  onEquipBadge?: (achievement: Achievement) => void;
  /** Callback when badge is unequipped */
  onUnequipBadge?: (achievementId: string) => void;
  /** Callback when badges are reordered */
  onReorderBadges?: (badges: Achievement[]) => void;
  /** Whether the showcase is editable (own profile) */
  isEditable?: boolean;
  /** Maximum number of badge slots */
  maxSlots?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Layout style */
  layout?: 'horizontal' | 'grid';
  /** Show title */
  showTitle?: boolean;
  /** Additional className */
  className?: string;
}

// ── Size config ───────────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { slot: 48, badge: 'sm' as const, gap: 8 },
  md: { slot: 64, badge: 'md' as const, gap: 12 },
  lg: { slot: 80, badge: 'lg' as const, gap: 16 },
};

// ── Sub-components ────────────────────────────────────────────────────

interface EmptySlotProps {
  size: number;
  onClick?: () => void;
  isEditable: boolean;
  index: number;
}

function EmptySlot({ size, onClick, isEditable, index }: EmptySlotProps) {
  return (
    <motion.button
      className={cn(
        'rounded-full border-2 border-dashed',
        'flex items-center justify-center',
        'transition-colors duration-200',
        isEditable
          ? 'cursor-pointer border-gray-600 hover:border-primary-500/50 hover:bg-primary-500/10'
          : 'cursor-default border-gray-700/50'
      )}
      style={{ width: size, height: size }}
      onClick={isEditable ? onClick : undefined}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={isEditable ? { scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.5)' } : undefined}
      whileTap={isEditable ? { scale: 0.95 } : undefined}
    >
      {isEditable && <PlusIcon className="h-5 w-5 text-gray-500 group-hover:text-primary-400" />}
    </motion.button>
  );
}

interface BadgeSlotProps {
  badge: Achievement;
  size: 'sm' | 'md' | 'lg';
  isEditable: boolean;
  onUnequip?: () => void;
  index: number;
}

function BadgeSlot({ badge, size, isEditable, onUnequip, index: _index }: BadgeSlotProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0, rotate: 180 }}
      transition={springs.dramatic}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatedBadgeWithTooltip
        achievement={badge}
        size={size}
        animated
        showProgress={false}
        isEquipped
      />

      {/* Unequip button */}
      <AnimatePresence>
        {isEditable && isHovered && (
          <motion.button
            className={cn(
              'absolute -right-1 -top-1 z-10',
              'h-5 w-5 rounded-full',
              'bg-red-500 hover:bg-red-600',
              'flex items-center justify-center',
              'shadow-lg shadow-black/50'
            )}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={onUnequip}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <XMarkIcon className="h-3 w-3 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────

/**
 * unknown for the gamification module.
 */
/**
 * Badge Showcase component.
 */
export function BadgeShowcase({
  equippedBadges,
  availableBadges = [],
  onEquipBadge,
  onUnequipBadge,
  onReorderBadges: _onReorderBadges,
  isEditable = false,
  maxSlots = 5,
  size = 'md',
  layout = 'horizontal',
  showTitle = true,
  className,
}: BadgeShowcaseProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const config = SIZE_CONFIG[size];

  const unequippedBadges = availableBadges.filter(
    (badge) => !equippedBadges.find((eq) => eq.id === badge.id)
  );

  const emptySlots = Math.max(0, maxSlots - equippedBadges.length);

  const handleEquipBadge = useCallback(
    (badge: Achievement) => {
      onEquipBadge?.(badge);
      setIsPickerOpen(false);
    },
    [onEquipBadge]
  );

  return (
    <div className={cn('relative', className)}>
      {/* Title */}
      {showTitle && (
        <div className="mb-3 flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-gray-300">Badge Showcase</h3>
          <span className="text-xs text-gray-500">
            ({equippedBadges.length}/{maxSlots})
          </span>
        </div>
      )}

      {/* Badge slots */}
      <div
        className={cn(
          'flex items-center',
          layout === 'horizontal' ? 'flex-row' : 'flex-wrap',
          layout === 'grid' && 'max-w-[280px]'
        )}
        style={{ gap: config.gap }}
      >
        <AnimatePresence mode="popLayout">
          {equippedBadges.map((badge, index) => (
            <BadgeSlot
              key={badge.id}
              badge={badge}
              size={config.badge}
              isEditable={isEditable}
              onUnequip={() => onUnequipBadge?.(badge.id)}
              index={index}
            />
          ))}
        </AnimatePresence>

        {Array.from({ length: emptySlots }).map((_, index) => (
          <EmptySlot
            key={`empty-${index}`}
            size={config.slot}
            onClick={() => setIsPickerOpen(true)}
            isEditable={isEditable}
            index={equippedBadges.length + index}
          />
        ))}
      </div>

      {/* Badge picker modal */}
      <BadgePickerModal
        isOpen={isPickerOpen && isEditable}
        unequippedBadges={unequippedBadges}
        onSelect={handleEquipBadge}
        onClose={() => setIsPickerOpen(false)}
      />
    </div>
  );
}

export default BadgeShowcase;
