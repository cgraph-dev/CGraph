/**
 * Theme selection switcher component.
 * @module
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeRegistry } from '@/themes/theme-registry';
import type { AppTheme } from '@/themes/theme-types';
import { CheckCircle, Sparkles, Lock } from 'lucide-react';
import { tweens, loop, springs } from '@/lib/animation-presets';

interface ThemeSwitcherProps {
  currentThemeId: string;
  onThemeChange: (themeId: string) => void;
  userIsPremium?: boolean;
  className?: string;
}

export function ThemeSwitcher({
  currentThemeId,
  onThemeChange,
  userIsPremium = false,
  className = '',
}: ThemeSwitcherProps) {
  const [themes, setThemes] = useState<AppTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>(currentThemeId);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Get all available themes
    setThemes(ThemeRegistry.getAllThemes());
  }, []);

  const handleThemeSelect = async (themeId: string) => {
    const theme = ThemeRegistry.getTheme(themeId);

    // Check if theme is premium and user doesn't have access
    if (theme?.isPremium && !userIsPremium) {
      // Show upgrade modal or notification
      alert('This theme requires a premium subscription');
      return;
    }

    setIsTransitioning(true);
    setSelectedTheme(themeId);

    // Smooth theme transition
    await ThemeRegistry.switchTheme(currentThemeId, themeId, 400);

    setIsTransitioning(false);
    onThemeChange(themeId);
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      default: 'Default',
      dark: 'Dark',
      light: 'Light',
      special: 'Special',
      custom: 'Custom',
      gaming: 'Gaming',
      professional: 'Professional',
    };
    return labels[category] || category;
  };

  // Group themes by category
  const themesByCategory = themes.reduce(
    (acc, theme) => {
      const category = theme.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(theme);
      return acc;
    },
    {} as Record<string, AppTheme[]> // type assertion: reduce accumulator type
  );

  return (
    <div className={`theme-switcher ${className}`}>
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold">Choose Your Theme</h2>
        <p className="text-sm text-gray-400">
          Select a theme to personalize your CGraph experience
        </p>
      </div>

      {/* Theme Grid by Category */}
      <div className="space-y-8">
        {Object.entries(themesByCategory).map(([category, categoryThemes]) => (
          <div key={category}>
            <h3 className="mb-4 text-lg font-semibold text-gray-300">
              {getCategoryLabel(category)}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedTheme === theme.id}
                  isLocked={theme.isPremium && !userIsPremium}
                  isTransitioning={isTransitioning && selectedTheme === theme.id}
                  onSelect={() => handleThemeSelect(theme.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ThemeCardProps {
  theme: AppTheme;
  isSelected: boolean;
  isLocked: boolean;
  isTransitioning: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isSelected, isLocked, isTransitioning, onSelect }: ThemeCardProps) {
  return (
    <motion.div
      className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-300 ${
        isSelected
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/50'
          : 'border-gray-700 hover:border-gray-600'
      } ${isLocked ? 'opacity-60' : ''} `}
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      onClick={onSelect}
    >
      {/* Theme Preview */}
      <div
        className="flex h-32 flex-col justify-between p-4"
        style={{
          background: theme.colors.background,
          color: theme.colors.textPrimary,
        }}
      >
        {/* Sample UI Elements */}
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full border-2"
            style={{
              borderColor: theme.colors.primary,
              boxShadow: theme.effects.glowEnabled
                ? `0 0 10px ${theme.colors.primaryGlow}`
                : 'none',
            }}
          />
          <div className="flex-1">
            <div
              className="mb-1 h-2 rounded"
              style={{ background: theme.colors.primary, width: '60%' }}
            />
            <div
              className="h-2 rounded"
              style={{ background: theme.colors.secondary, width: '40%' }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div
            className="flex h-8 items-center rounded px-3 py-1 text-xs"
            style={{
              background: theme.components.button.primary,
              color: 'white',
            }}
          >
            Sample Button
          </div>
        </div>
      </div>

      {/* Theme Info */}
      <div className="border-t border-gray-700 bg-gray-900/50 p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <h4 className="flex items-center gap-2 font-semibold text-white">
              {theme.name}
              {theme.isPremium && <Sparkles className="h-4 w-4 text-yellow-500" />}
            </h4>
            <p className="mt-1 text-xs text-gray-400">{theme.description}</p>
          </div>
        </div>

        {/* Theme Features */}
        <div className="mt-2 flex flex-wrap gap-1">
          {theme.effects.glowEnabled && (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              Glow
            </span>
          )}
          {theme.effects.particlesEnabled && (
            <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
              Particles
            </span>
          )}
          {theme.matrix?.enabled && (
            <span className="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
              Matrix
            </span>
          )}
          {theme.effects.scanlines && (
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
              Scanlines
            </span>
          )}
        </div>
      </div>

      {/* Selected Indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute right-2 top-2"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={springs.bouncy}
          >
            <CheckCircle className="h-6 w-6 fill-emerald-500/20 text-emerald-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <Lock className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
            <p className="text-xs font-semibold text-white">Premium Required</p>
          </div>
        </div>
      )}

      {/* Transitioning Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={loop(tweens.slow)}
            >
              <Sparkles className="h-8 w-8 text-emerald-500" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
