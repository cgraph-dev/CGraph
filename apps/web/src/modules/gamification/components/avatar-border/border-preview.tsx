/**
 * BorderPreview Component
 *
 * Preview modal for avatar border cosmetics. Shows:
 * - Large preview with the border animation on user's actual avatar
 * - In-context preview (fake message bubble with border)
 * - Rarity display and animation type name
 * - Purchase button with coin cost
 *
 * @module avatar-border/border-preview
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  SparklesIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { AnimatedBorder, type BorderAnimationType } from './animated-border';

// ── Types ──────────────────────────────────────────────────────────────

export interface BorderPreviewData {
  id: string;
  name: string;
  description?: string;
  animationType: BorderAnimationType;
  rarity: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  coinPrice?: number;
  isOwned?: boolean;
  isEquipped?: boolean;
}

export interface BorderPreviewProps {
  /** Border to preview */
  border: BorderPreviewData;
  /** User's current avatar URL */
  avatarUrl?: string;
  /** User's display name */
  displayName?: string;
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Purchase handler */
  onPurchase?: (borderId: string) => void;
  /** Equip handler */
  onEquip?: (borderId: string) => void;
  /** User's coin balance */
  coinBalance?: number;
  /** Additional className */
  className?: string;
}

// ── Rarity Styling ─────────────────────────────────────────────────────

const RARITY_STYLES: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  common: { label: 'Common', color: 'text-gray-400', bg: 'bg-gray-500/20', gradient: 'from-gray-500 to-gray-600' },
  uncommon: { label: 'Uncommon', color: 'text-green-400', bg: 'bg-green-500/20', gradient: 'from-green-500 to-emerald-600' },
  rare: { label: 'Rare', color: 'text-blue-400', bg: 'bg-blue-500/20', gradient: 'from-blue-500 to-indigo-600' },
  epic: { label: 'Epic', color: 'text-purple-400', bg: 'bg-purple-500/20', gradient: 'from-purple-500 to-violet-600' },
  legendary: { label: 'Legendary', color: 'text-yellow-400', bg: 'bg-yellow-500/20', gradient: 'from-yellow-500 to-amber-600' },
  mythic: { label: 'Mythic', color: 'text-pink-400', bg: 'bg-pink-500/20', gradient: 'from-pink-500 to-rose-600' },
  unique: { label: 'Unique', color: 'text-indigo-400', bg: 'bg-indigo-500/20', gradient: 'from-indigo-500 to-purple-600' },
};

const ANIMATION_LABELS: Record<BorderAnimationType, string> = {
  none: 'None',
  static: 'Static',
  pulse: 'Pulse',
  rotate: 'Rotating Ring',
  shimmer: 'Shimmer',
  wave: 'Wave',
  breathe: 'Breathe',
  spin: 'Dual Spin',
  rainbow: 'Rainbow',
  particles: 'Particles',
  glow: 'Glow',
  flow: 'Flowing Gradient',
  spark: 'Spark',
};

/**
 * BorderPreview component.
 *
 * Full-featured preview modal for avatar border cosmetics.
 */
export const BorderPreview = memo(function BorderPreview({
  border,
  avatarUrl = '/default-avatar.png',
  displayName = 'You',
  isOpen,
  onClose,
  onPurchase,
  onEquip,
  coinBalance = 0,
  className,
}: BorderPreviewProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const rarityStyle = RARITY_STYLES[border.rarity] ?? RARITY_STYLES.common;
  const canAfford = (border.coinPrice ?? 0) <= coinBalance;

  const handlePurchase = async () => {
    if (!onPurchase || !canAfford || border.isOwned) return;
    setIsPurchasing(true);
    try {
      onPurchase(border.id);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleEquip = () => {
    onEquip?.(border.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={cn(
              'relative w-full max-w-md rounded-2xl border border-white/10 bg-dark-800 p-6 shadow-2xl',
              className,
            )}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
              aria-label="Close preview"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6 text-center">
              <h3 className="text-lg font-bold text-white">{border.name}</h3>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    rarityStyle.bg,
                    rarityStyle.color,
                  )}
                >
                  <SparklesIcon className="h-3 w-3" />
                  {rarityStyle.label}
                </span>
                <span className="text-xs text-gray-500">
                  {ANIMATION_LABELS[border.animationType]}
                </span>
              </div>
            </div>

            {/* Large Avatar Preview */}
            <div className="mb-6 flex justify-center">
              <AnimatedBorder
                animationType={border.animationType}
                borderColor={border.primaryColor ?? '#6366f1'}
                borderColorSecondary={border.secondaryColor}
                borderColorAccent={border.accentColor}
                size={128}
                borderWidth={4}
              >
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                  style={{ width: 120, height: 120 }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.png';
                  }}
                />
              </AnimatedBorder>
            </div>

            {/* In-context Preview: Fake message bubble */}
            <div className="mb-6 rounded-xl border border-white/5 bg-dark-700/50 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                In Chat Preview
              </p>
              <div className="flex items-start gap-3">
                <AnimatedBorder
                  animationType={border.animationType}
                  borderColor={border.primaryColor ?? '#6366f1'}
                  borderColorSecondary={border.secondaryColor}
                  borderColorAccent={border.accentColor}
                  size={36}
                  borderWidth={2}
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full rounded-full object-cover"
                    style={{ width: 32, height: 32 }}
                  />
                </AnimatedBorder>
                <div>
                  <span className="text-sm font-medium text-white">{displayName}</span>
                  <p className="mt-0.5 text-sm text-gray-300">
                    Check out my new avatar border! ✨
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {border.description && (
              <p className="mb-4 text-center text-sm text-gray-400">{border.description}</p>
            )}

            {/* Action Button */}
            <div className="flex gap-3">
              {border.isOwned ? (
                <button
                  onClick={handleEquip}
                  disabled={border.isEquipped}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-all',
                    border.isEquipped
                      ? 'cursor-default bg-green-500/20 text-green-400'
                      : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30',
                  )}
                >
                  {border.isEquipped ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      Equipped
                    </>
                  ) : (
                    'Equip Border'
                  )}
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={!canAfford || isPurchasing}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-all',
                    canAfford
                      ? `bg-gradient-to-r ${rarityStyle.gradient} text-white hover:opacity-90`
                      : 'cursor-not-allowed bg-gray-700 text-gray-500',
                  )}
                >
                  <ShoppingCartIcon className="h-5 w-5" />
                  {isPurchasing
                    ? 'Purchasing...'
                    : border.coinPrice
                      ? `${border.coinPrice.toLocaleString()} Coins`
                      : 'Free'}
                  {!canAfford && border.coinPrice ? (
                    <span className="ml-1 text-xs opacity-70">
                      (Need {((border.coinPrice ?? 0) - coinBalance).toLocaleString()} more)
                    </span>
                  ) : null}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default BorderPreview;
