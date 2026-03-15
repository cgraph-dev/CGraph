/**
 * CustomizationItemCard Component
 *
 * Generic, reusable card component for customization items (bubbles, effects, reactions, etc.).
 * Handles common selection, preview, and lock status logic.
 *
 * @version 1.0.0
 */

import { memo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { LockClosedIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';

// ==================== TYPE DEFINITIONS ====================

export interface CustomizationItem {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockRequirement?: string;
  isPremium?: boolean;
}

export interface CustomizationItemCardProps<T extends CustomizationItem> {
  /** The item data to display */
  item: T;
  /** Index for stagger animation */
  index: number;
  /** Whether this item is currently selected */
  isSelected: boolean;
  /** Whether this item is being previewed (locked item preview mode) */
  isPreviewing: boolean;
  /** Callback when item is clicked */
  onSelect: (id: string, isUnlocked: boolean) => void;
  /** Custom preview content - renders in the preview area */
  children: ReactNode;
  /** Animation direction for entrance */
  animationDirection?: 'scale' | 'slide-left' | 'slide-right';
  /** Layout variant affecting card size/styling */
  layout?: 'grid' | 'list' | 'compact';
  /** Whether to center the name and description text */
  centerText?: boolean;
}

// ==================== ANIMATION VARIANTS ====================

const getAnimationProps = (direction: 'scale' | 'slide-left' | 'slide-right', index: number) => {
  const delay = index * 0.03;

  switch (direction) {
    case 'slide-left':
      return {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { delay },
      };
    case 'slide-right':
      return {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        transition: { delay },
      };
    case 'scale':
    default:
      return {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay },
      };
  }
};

// ==================== STATUS BUTTON COMPONENT ====================

interface StatusButtonProps {
  isSelected: boolean;
  isPreviewing: boolean;
  isUnlocked: boolean;
  unlockRequirement?: string;
  onApply: () => void;
  layout: 'grid' | 'list' | 'compact';
}

const StatusButton = memo(function StatusButton({
  isSelected,
  isPreviewing,
  isUnlocked,
  unlockRequirement,
  onApply,
  layout,
}: StatusButtonProps) {
  const isCompact = layout === 'compact';
  const buttonPadding = isCompact ? 'px-3 py-1.5' : 'px-4 py-2';
  const textSize = isCompact ? 'text-xs' : 'text-sm';
  const iconSize = isCompact ? 'h-4 w-4' : 'h-5 w-5';

  if (isUnlocked) {
    if (isSelected) {
      return (
        <div
          className={`flex items-center ${layout === 'grid' ? 'justify-center' : ''} gap-2 rounded-lg border border-green-500/30 bg-green-500/20 ${buttonPadding}`}
        >
          <CheckCircleIconSolid className={`${iconSize} text-green-400`} />
          <span className={`${textSize} font-medium text-green-400`}>Active</span>
        </div>
      );
    }
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onApply();
        }}
        className={`${layout === 'grid' ? 'w-full' : ''} rounded-lg bg-primary-600 ${buttonPadding} ${textSize} font-medium text-white transition-colors hover:bg-primary-700`}
      >
        Apply
      </button>
    );
  }

  if (isPreviewing) {
    return (
      <div
        className={`flex items-center ${layout === 'grid' ? 'justify-center' : ''} gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/20 ${buttonPadding}`}
      >
        <EyeIcon className={`${iconSize} text-yellow-400`} />
        <span className={`${textSize} font-medium text-yellow-400`}>Previewing</span>
      </div>
    );
  }

  // Locked state
  if (layout === 'grid') {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
        <div className="flex items-center gap-1">
          <LockClosedIcon className="h-4 w-4 text-white/40" />
          <span className="text-xs text-white/60">Click to Preview</span>
        </div>
        {unlockRequirement && (
          <p className="mt-1 text-center text-xs text-white/40">{unlockRequirement}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 ${buttonPadding}`}
    >
      <LockClosedIcon className={`${iconSize} text-white/40`} />
      <span className={`${textSize} text-white/60`}>Click to Preview</span>
    </div>
  );
});

// ==================== MAIN COMPONENT ====================

function CustomizationItemCardInner<T extends CustomizationItem>({
  item,
  index,
  isSelected,
  isPreviewing,
  onSelect,
  children,
  animationDirection = 'scale',
  layout = 'grid',
  centerText = false,
}: CustomizationItemCardProps<T>) {
  const animationProps = getAnimationProps(animationDirection, index);

  const getGlassVariant = () => {
    if (isSelected || isPreviewing) return 'neon';
    if (item.unlocked) return 'crystal';
    return 'frosted';
  };

  const getGlowColor = () => {
    if (isPreviewing) return 'rgba(234, 179, 8, 0.4)';
    if (isSelected) return 'rgba(139, 92, 246, 0.3)';
    return undefined;
  };

  const handleSelect = () => {
    onSelect(item.id, item.unlocked);
  };

  if (layout === 'list') {
    // List layout - horizontal card
    return (
      <motion.div {...animationProps}>
        <GlassCard
          variant={getGlassVariant()}
          glow={isSelected || isPreviewing}
          glowColor={getGlowColor()}
          className={`relative cursor-pointer p-4 transition-all hover:scale-[1.01] ${
            isPreviewing ? 'ring-2 ring-yellow-500' : ''
          }`}
          onClick={handleSelect}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="mb-1 text-base font-bold text-white">{item.name}</h4>
              <p className="text-sm text-white/60">{item.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Custom preview content */}
              {children}

              {/* Status Button */}
              <StatusButton
                isSelected={isSelected}
                isPreviewing={isPreviewing}
                isUnlocked={item.unlocked}
                unlockRequirement={item.unlockRequirement}
                onApply={handleSelect}
                layout={layout}
              />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  // Grid layout - vertical card (default)
  return (
    <motion.div {...animationProps}>
      <GlassCard
        variant={getGlassVariant()}
        glow={isSelected || isPreviewing}
        glowColor={getGlowColor()}
        className={`relative cursor-pointer p-4 transition-all hover:scale-[1.02] ${
          isPreviewing ? 'ring-2 ring-yellow-500' : ''
        }`}
        onClick={handleSelect}
      >
        {/* Premium Badge */}
        {item.isPremium && (
          <div className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">
            PRO
          </div>
        )}

        {/* Custom preview content */}
        <div className="mb-3 flex h-32 items-center justify-center">{children}</div>

        {/* Item Name */}
        <h4
          className={`mb-1 ${layout === 'compact' ? 'text-sm' : 'text-base'} font-bold text-white ${centerText ? 'text-center' : ''}`}
        >
          {item.name}
        </h4>

        {/* Description */}
        <p
          className={`mb-3 ${layout === 'compact' ? 'text-xs' : 'text-sm'} text-white/60 ${centerText ? 'text-center' : ''}`}
        >
          {item.description}
        </p>

        {/* Status Button */}
        <StatusButton
          isSelected={isSelected}
          isPreviewing={isPreviewing}
          isUnlocked={item.unlocked}
          unlockRequirement={item.unlockRequirement}
          onApply={handleSelect}
          layout={layout}
        />
      </GlassCard>
    </motion.div>
  );
}

// Export memoized component with generic type support
// type assertion: preserving generic type through React.memo wrapper
// type assertion: React.memo loses generic type parameter, re-assert original component type

 
export const CustomizationItemCard = memo(
  CustomizationItemCardInner
) as typeof CustomizationItemCardInner;

export default CustomizationItemCard;
