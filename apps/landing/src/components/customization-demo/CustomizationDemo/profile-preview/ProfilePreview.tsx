/**
 * ProfilePreview - Main preview component
 *
 * Displays a preview of the user profile with various card styles.
 * Delegates to card variant components based on profileCardStyle.
 * Uses getEffectStyles() for distinct visual treatments per Effect Style.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DemoState } from '../types';
import { themeColors } from '../constants';
import { getProfileThemeConfig } from '../profileThemes';
import { getEffectStyles } from '../effectStyles';

import { MinimalProfileCard } from './MinimalProfileCard';
import { DetailedProfileCard } from './DetailedProfileCard';
import { CompactProfileCard } from './CompactProfileCard';
import { ExpandedProfileCard } from './ExpandedProfileCard';
import { GamingProfileCard } from './GamingProfileCard';

interface ProfilePreviewProps {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}

export const ProfilePreview = memo(function ProfilePreview({
  state,
  onChange: _onChange,
}: ProfilePreviewProps) {
  const colors = themeColors[state.theme];
  const speedMultiplier =
    state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1;

  // Get selected profile theme configuration
  const selectedTheme = getProfileThemeConfig(state.selectedProfileThemeId);

  // Get effect-specific styles and animations
  const effectStyles = getEffectStyles(state.effect, colors, speedMultiplier);

  // Use selected theme's background and glow when a theme is chosen, otherwise use effect styles
  const containerStyle = selectedTheme
    ? {
        background: `linear-gradient(135deg, ${selectedTheme.background.colors.join(', ')})`,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `0 0 40px ${selectedTheme.effects.glow || colors.glow}`,
      }
    : effectStyles.container;

  const glowColor = selectedTheme?.effects.glow || colors.glow;
  const particleCount = selectedTheme?.effects.particles?.count || 15;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl"
      style={containerStyle}
      animate={
        selectedTheme
          ? {
              boxShadow: [
                `0 0 30px ${glowColor}`,
                `0 0 50px ${glowColor}`,
                `0 0 30px ${glowColor}`,
              ],
            }
          : effectStyles.containerAnimate
      }
      transition={
        selectedTheme
          ? { duration: 2 * speedMultiplier, repeat: Infinity }
          : effectStyles.containerTransition
      }
    >
      {/* Effect-specific overlay animation */}
      {!selectedTheme && effectStyles.hasOverlay && (
        <motion.div
          style={effectStyles.overlayStyle}
          animate={effectStyles.overlayAnimate}
          transition={effectStyles.overlayTransition}
        />
      )}

      {/* Particles overlay */}
      {(state.particlesEnabled || selectedTheme) && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: particleCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: selectedTheme?.effects.glow || colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: (2 + Math.random()) * speedMultiplier,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated background */}
      {(state.animatedBackground || selectedTheme?.background.type === 'animated') && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: selectedTheme
              ? `linear-gradient(45deg, ${selectedTheme.background.colors[0]}10, ${selectedTheme.background.colors[1]}10, transparent)`
              : `linear-gradient(45deg, ${colors.primary}10, ${colors.secondary}10, transparent)`,
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 8 * speedMultiplier, repeat: Infinity }}
        />
      )}

      <div className="relative p-6">
        {/* Profile Card Variants */}
        {state.profileCardStyle === 'minimal' && (
          <MinimalProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}

        {state.profileCardStyle === 'detailed' && (
          <DetailedProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}

        {state.profileCardStyle === 'compact' && (
          <CompactProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}

        {state.profileCardStyle === 'expanded' && (
          <ExpandedProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}

        {state.profileCardStyle === 'gaming' && (
          <GamingProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}
      </div>
    </motion.div>
  );
});
