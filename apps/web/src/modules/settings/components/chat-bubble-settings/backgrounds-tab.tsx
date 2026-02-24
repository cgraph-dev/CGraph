/**
 * Chat bubble backgrounds selection tab.
 * @module
 */
import { motion } from 'framer-motion';
import { LockClosedIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { BackgroundCategory, ChatBackground } from '@/data/chatBackgrounds';
import type { BackgroundsTabProps, CategoryColors } from './types';
import { tweens, springs } from '@/lib/animation-presets';

// Category colors for backgrounds
const CATEGORY_COLORS: CategoryColors = {
  free: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  premium: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  legendary: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  seasonal: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
};

const getBackgroundPreviewStyle = (bg: ChatBackground): React.CSSProperties => {
  if (bg.type === 'solid') {
    return { backgroundColor: bg.colors[0] };
  }
  if (bg.type === 'gradient' || bg.type === 'animated') {
    return {
      background: `linear-gradient(135deg, ${bg.colors.join(', ')})`,
    };
  }
  if (bg.type === 'particle') {
    return {
      background: `radial-gradient(circle at 50% 50%, ${bg.colors[0]}40 0%, ${bg.colors[1] || bg.colors[0]}20 100%)`,
      backgroundColor: '#0f0f17',
    };
  }
  return { backgroundColor: bg.colors[0] };
};

/**
 * BackgroundsTab - Chat background customization
 */
export function BackgroundsTab({
  backgrounds,
  selectedBackground,
  setSelectedBackground,
  backgroundCategory,
  setBackgroundCategory,
}: BackgroundsTabProps) {
  // Mock owned backgrounds - in production this would come from user data
  const ownedBackgrounds = ['default_dark', 'subtle_gradient', 'ocean_depth', 'forest_night'];

  const categories: { id: BackgroundCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'free', label: 'Free' },
    { id: 'premium', label: 'Premium' },
    { id: 'legendary', label: 'Legendary' },
    { id: 'seasonal', label: 'Seasonal' },
  ];

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <GlassCard variant="frosted" className="p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const colors = cat.id !== 'all' ? CATEGORY_COLORS[cat.id] : null;
            return (
              <motion.button
                key={cat.id}
                onClick={() => {
                  setBackgroundCategory(cat.id);
                  HapticFeedback.light();
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  backgroundCategory === cat.id
                    ? colors
                      ? `${colors.bg} ${colors.text} border ${colors.border}`
                      : 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      {/* Selected Background Preview */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Current Background Preview</h3>
        <div className="relative h-48 overflow-hidden rounded-xl">
          {/* Background */}
          {backgrounds.find((bg) => bg.id === selectedBackground) && (
            <motion.div
              className="absolute inset-0"
              style={getBackgroundPreviewStyle(
                backgrounds.find((bg) => bg.id === selectedBackground)!
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={tweens.standard}
            >
              {/* Animated effect overlay */}
              {backgrounds.find((bg) => bg.id === selectedBackground)?.animation && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration:
                      backgrounds.find((bg) => bg.id === selectedBackground)?.animation?.speed || 5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}
            </motion.div>
          )}

          {/* Sample messages */}
          <div className="relative z-10 space-y-3 p-4">
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl rounded-bl-md bg-dark-800/80 px-4 py-2 backdrop-blur-sm">
                <p className="text-sm text-white">Hey! How's it going?</p>
                <span className="text-xs text-gray-400">12:34 PM</span>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary-600/80 px-4 py-2 backdrop-blur-sm">
                <p className="text-sm text-white">Great! Just customizing my chat!</p>
                <span className="text-xs text-white/70">12:35 PM</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Background Grid */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">
          Available Backgrounds
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({backgrounds.length} backgrounds)
          </span>
        </h3>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {backgrounds.map((bg) => {
            const isOwned = ownedBackgrounds.includes(bg.id);
            const isSelected = selectedBackground === bg.id;
            const categoryColors = CATEGORY_COLORS[bg.category];

            return (
              <motion.button
                key={bg.id}
                onClick={() => {
                  if (isOwned) {
                    setSelectedBackground(bg.id);
                    HapticFeedback.medium();
                  } else {
                    HapticFeedback.heavy();
                  }
                }}
                className={`relative overflow-hidden rounded-xl transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-dark-900'
                    : 'hover:ring-1 hover:ring-white/20'
                } ${!isOwned ? 'opacity-70' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Background Preview */}
                <div className="h-24 w-full" style={getBackgroundPreviewStyle(bg)}>
                  {/* Animation indicator */}
                  {bg.animation && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{
                        duration: bg.animation.speed / 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  )}

                  {/* Lock overlay for unowned */}
                  {!isOwned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-dark-900/60">
                      <div className="text-center">
                        <LockClosedIcon className="mx-auto mb-1 h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-400">{bg.coinPrice} coins</span>
                      </div>
                    </div>
                  )}

                  {/* Selected check */}
                  {isSelected && isOwned && (
                    <motion.div
                      className="absolute right-2 top-2 rounded-full bg-primary-500 p-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={springs.bouncy}
                    >
                      <CheckIcon className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </div>

                {/* Info */}
                <div className="bg-dark-800 p-3">
                  <p className="truncate text-sm font-medium text-white">{bg.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border} border capitalize`}
                    >
                      {bg.category}
                    </span>
                    {bg.animation && (
                      <span className="text-xs text-gray-400">{bg.animation.type}</span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      {/* Animation Settings for Selected Background */}
      {backgrounds.find((bg) => bg.id === selectedBackground)?.animation && (
        <GlassCard variant="frosted" className="p-6">
          <h3 className="mb-4 text-lg font-bold text-white">Animation Settings</h3>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Animation Speed</label>
                <span className="text-sm text-primary-400">
                  {backgrounds.find((bg) => bg.id === selectedBackground)?.animation?.speed}s
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                defaultValue={
                  backgrounds.find((bg) => bg.id === selectedBackground)?.animation?.speed || 5
                }
                className="w-full accent-primary-500"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Animation Intensity</label>
                <span className="text-sm text-primary-400">
                  {backgrounds.find((bg) => bg.id === selectedBackground)?.animation?.intensity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={
                  backgrounds.find((bg) => bg.id === selectedBackground)?.animation?.intensity || 50
                }
                className="w-full accent-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Reduce Motion</label>
              <button className="relative h-6 w-12 rounded-full bg-dark-600 transition-colors hover:bg-dark-500">
                <motion.div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white" />
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Info Box */}
      <GlassCard variant="crystal" glow className="p-4">
        <div className="flex items-start gap-3">
          <SparklesIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-400" />
          <div>
            <p className="text-sm text-gray-300">
              <strong className="text-white">Premium backgrounds</strong> include animated effects
              like waves, particles, and flowing gradients. Unlock them with coins from the shop or
              by upgrading to Premium+.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
