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
 * - Cross-forum visibility - badges follow user everywhere
 *
 * @version 1.0.0
 * @since 2026-01-18
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { AnimatedBadgeWithTooltip } from './AnimatedBadge';
import type { Achievement } from '@/stores/gamificationStore';

// ==================== TYPE DEFINITIONS ====================

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

// ==================== SIZE CONFIGURATIONS ====================

const SIZE_CONFIG = {
  sm: { slot: 48, badge: 'sm' as const, gap: 8 },
  md: { slot: 64, badge: 'md' as const, gap: 12 },
  lg: { slot: 80, badge: 'lg' as const, gap: 16 },
};

// ==================== EMPTY SLOT COMPONENT ====================

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
          ? 'border-gray-600 hover:border-primary-500/50 hover:bg-primary-500/10 cursor-pointer'
          : 'border-gray-700/50 cursor-default'
      )}
      style={{ width: size, height: size }}
      onClick={isEditable ? onClick : undefined}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={isEditable ? { scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.5)' } : undefined}
      whileTap={isEditable ? { scale: 0.95 } : undefined}
    >
      {isEditable && (
        <PlusIcon className="w-5 h-5 text-gray-500 group-hover:text-primary-400" />
      )}
    </motion.button>
  );
}

// ==================== BADGE SLOT COMPONENT ====================

interface BadgeSlotProps {
  badge: Achievement;
  size: 'sm' | 'md' | 'lg';
  isEditable: boolean;
  onUnequip?: () => void;
  index: number;
}

function BadgeSlot({ badge, size, isEditable, onUnequip, index }: BadgeSlotProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0, rotate: 180 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: index * 0.1,
      }}
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
              'absolute -top-1 -right-1 z-10',
              'w-5 h-5 rounded-full',
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
            <XMarkIcon className="w-3 h-3 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==================== MAIN COMPONENT ====================

export function BadgeShowcase({
  equippedBadges,
  availableBadges = [],
  onEquipBadge,
  onUnequipBadge,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Get available badges that aren't already equipped
  const unequippedBadges = availableBadges.filter(
    (badge) => !equippedBadges.find((eq) => eq.id === badge.id)
  );

  // Calculate empty slots
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
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="w-4 h-4 text-primary-400" />
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
        {/* Equipped badges */}
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

        {/* Empty slots */}
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
      <AnimatePresence>
        {isPickerOpen && isEditable && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsPickerOpen(false)}
            />

            {/* Picker content */}
            <motion.div
              className={cn(
                'relative z-10 w-full max-w-lg',
                'bg-dark-800 rounded-2xl',
                'border border-white/10',
                'shadow-2xl shadow-black/50',
                'overflow-hidden'
              )}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-primary-400" />
                  <h2 className="text-lg font-bold text-white">Select Badge</h2>
                </div>
                <button
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setIsPickerOpen(false)}
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Badge grid */}
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {unequippedBadges.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No more badges available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Unlock more achievements to equip them here
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {unequippedBadges.map((badge) => (
                      <motion.button
                        key={badge.id}
                        className={cn(
                          'p-2 rounded-xl',
                          'bg-dark-700/50 hover:bg-dark-600/50',
                          'border border-transparent hover:border-primary-500/30',
                          'transition-colors'
                        )}
                        onClick={() => handleEquipBadge(badge)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <AnimatedBadgeWithTooltip
                          achievement={badge}
                          size="sm"
                          animated
                          showProgress={false}
                        />
                        <p className="text-[10px] text-gray-400 mt-1 truncate text-center">
                          {badge.title}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-3 bg-dark-700/50 border-t border-white/10">
                <p className="text-xs text-gray-500 text-center">
                  Equipped badges are visible on your profile across all forums
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== COMPACT SHOWCASE (for cards/mentions) ====================

export interface CompactBadgeShowcaseProps {
  /** Array of equipped achievements */
  badges: Achievement[];
  /** Maximum badges to show */
  maxVisible?: number;
  /** Size */
  size?: 'xs' | 'sm';
  /** Additional className */
  className?: string;
}

export function CompactBadgeShowcase({
  badges,
  maxVisible = 3,
  size = 'xs',
  className,
}: CompactBadgeShowcaseProps) {
  const visibleBadges = badges.slice(0, maxVisible);
  const hiddenCount = badges.length - maxVisible;

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {visibleBadges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          style={{ marginLeft: index > 0 ? -8 : 0 }}
        >
          <AnimatedBadgeWithTooltip
            achievement={badge}
            size={size}
            animated
            showProgress={false}
          />
        </motion.div>
      ))}

      {hiddenCount > 0 && (
        <motion.span
          className="text-xs text-gray-400 ml-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          +{hiddenCount}
        </motion.span>
      )}
    </div>
  );
}

export default BadgeShowcase;
