/**
 * ProfileThemeCard Component
 *
 * Profile theme preview card with animated backgrounds,
 * particles, tier badges, and holographic shine effects.
 */

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import type { ProfileThemeCardProps } from './types';
import { useParticles } from './useParticles';
import { getBackgroundAnimation } from './useThemeEffects';
import TierBadge from './tier-badge';
import PreviewCard from './preview-card';
import ThemeEffects from './theme-effects';
import LockOverlay from './lock-overlay';
import SelectedIndicator from './selected-indicator';

/**
 * Profile Theme Card display component.
 */
export default function ProfileThemeCard({
  theme,
  isSelected,
  onSelect,
  allowPreview = true,
  showParticles = true,
}: ProfileThemeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const isLocked = !theme.unlocked && !allowPreview;
  const canInteract = !isLocked;

  // Holographic shine effect based on mouse position
  const shineX = useTransform(mouseX, [0, 1], ['-100%', '200%']);
  const shineY = useTransform(mouseY, [0, 1], ['-100%', '200%']);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const particles = useParticles(
    theme.particleType,
    theme.particleCount,
    theme.particleColors,
    showParticles
  );

  return (
    <motion.div
      ref={cardRef}
      onClick={() => canInteract && onSelect()}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={canInteract ? 0 : -1}
      onKeyDown={(e) => e.key === 'Enter' && canInteract && onSelect()}
      className={`group relative aspect-[3/4] w-full overflow-hidden rounded-2xl transition-all duration-300 ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed'} ${isSelected ? 'shadow-2xl ring-2 ring-white' : 'hover:ring-1 hover:ring-white/30'} `}
      whileHover={canInteract ? { scale: 1.02, y: -4 } : {}}
      whileTap={canInteract ? { scale: 0.98 } : {}}
      style={{
        boxShadow: isSelected && theme.glowEnabled ? `0 0 30px ${theme.glowColor}60` : undefined,
      }}
    >
      {/* Background gradient with animation */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
          backgroundSize: '400% 400%',
        }}
        {...getBackgroundAnimation(theme)}
      />

      {/* Visual effects layer */}
      <ThemeEffects
        theme={theme}
        particles={particles}
        showParticles={showParticles}
        isHovered={isHovered}
        shineX={shineX}
        shineY={shineY}
      />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-3">
        <TierBadge theme={theme} />
        <PreviewCard theme={theme} />
      </div>

      {/* Lock overlay */}
      <LockOverlay theme={theme} />

      {/* Selected indicator */}
      {isSelected && <SelectedIndicator theme={theme} />}
    </motion.div>
  );
}
