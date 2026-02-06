/**
 * ProfileCardPreview - Profile card preview with live customization
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { AnimatedAvatar } from '../AnimatedAvatar';
import {
  useCustomizationStore,
  THEME_COLORS as themeColors,
  BORDER_ID_TO_TYPE,
  PROFILE_THEME_TO_COLOR,
  TITLE_DISPLAY_NAMES,
} from '@/stores/customization';
import { usePrefersReducedMotion } from '@/hooks';
import { getThemeById, type ProfileThemeConfig } from '@/data/profileThemes';
import { springs } from '@/lib/animationPresets';
import { TiltCard, GlowText, FireText } from '@/shared/components/ui';
import {
  ANIMATION_SPEED_MULTIPLIERS,
  MOCK_BADGES,
  PARTICLE_COLORS,
  LEGENDARY_TITLE_IDS,
} from './constants';
import type { ParticleData, ParticleStyle } from './types';

export const ProfileCardPreview = memo(function ProfileCardPreview() {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Get settings from unified store with shallow comparison
  const settings = useCustomizationStore(
    useShallow((state) => ({
      themePreset: state.themePreset,
      effectPreset: state.effectPreset,
      avatarBorderType: state.avatarBorderType,
      avatarBorderColor: state.avatarBorderColor,
      avatarSize: state.avatarSize,
      particlesEnabled: state.particlesEnabled,
      glowEnabled: state.glowEnabled,
      blurEnabled: state.blurEnabled,
      showBadges: state.showBadges,
      showStatus: state.showStatus,
      animationSpeed: state.animationSpeed,
      equippedTitle: state.equippedTitle,
      equippedBadges: state.equippedBadges,
      selectedBorderId: state.selectedBorderId,
      avatarBorder: state.avatarBorder,
      title: state.title,
      profileTheme: state.profileTheme,
      particleEffect: state.particleEffect,
    }))
  );

  // Determine effective title (legacy alias or canonical)
  const effectiveTitle = settings.title || settings.equippedTitle;

  // Determine avatar border type using centralized mapping
  const effectiveBorderId = settings.selectedBorderId || settings.avatarBorder;
  const effectiveBorderType = effectiveBorderId
    ? BORDER_ID_TO_TYPE[effectiveBorderId] || settings.avatarBorderType
    : settings.avatarBorderType;

  // Determine color from profile theme using centralized mapping
  const effectiveColorPreset =
    (settings.profileTheme && PROFILE_THEME_TO_COLOR[settings.profileTheme]) ||
    settings.avatarBorderColor;

  // Look up the active profile theme config
  const activeProfileTheme = useMemo<ProfileThemeConfig | null>(() => {
    return settings.profileTheme ? (getThemeById(settings.profileTheme) ?? null) : null;
  }, [settings.profileTheme]);

  // Check if particles should be shown
  const showParticles =
    !prefersReducedMotion &&
    (settings.particleEffect !== 'none' ||
      settings.particlesEnabled ||
      activeProfileTheme?.particleType !== 'none');

  // Check if this is a legendary/mythic title for fire effect
  const isLegendaryTitle = effectiveTitle && LEGENDARY_TITLE_IDS.includes(effectiveTitle);

  const colors = themeColors[effectiveColorPreset];
  const speedMultiplier = ANIMATION_SPEED_MULTIPLIERS[settings.animationSpeed];

  // Memoize particle data to prevent recalculation
  const particleData = useMemo((): ParticleData[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      width: 3 + Math.random() * 4,
      height: 3 + Math.random() * 4,
      left: Math.random() * 100,
      top: Math.random() * 100,
      boxShadow: 4 + Math.random() * 8,
      delay: i * 0.2,
      duration: 2.5 + (i % 3) * 0.5,
    }));
  }, []);

  // Get particle style based on active theme
  const getParticleStyle = useMemo((): ParticleStyle => {
    if (activeProfileTheme?.particleType) {
      return {
        color: PARTICLE_COLORS[activeProfileTheme.particleType] || colors.primary,
        shape: activeProfileTheme.particleType === 'pixel' ? 'square' : 'circle',
      };
    }
    return { color: colors.primary, shape: 'circle' };
  }, [activeProfileTheme, colors.primary]);

  // Effect background styles
  const getBackgroundStyle = () => {
    if (
      activeProfileTheme?.backgroundGradient &&
      activeProfileTheme.backgroundGradient.length > 0
    ) {
      const gradientColors = activeProfileTheme.backgroundGradient.join(', ');
      return {
        background: `linear-gradient(135deg, ${gradientColors})`,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: activeProfileTheme.glowEnabled ? `0 0 40px ${colors.primary}40` : 'none',
      };
    }

    const bgEffect = settings.effectPreset as string;

    switch (bgEffect) {
      case 'glassmorphism':
        return {
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: settings.blurEnabled ? 'blur(20px)' : 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        };
      case 'neon':
        return {
          background: 'rgba(0, 0, 0, 0.9)',
          border: `1px solid ${colors.primary}`,
          boxShadow: settings.glowEnabled
            ? `0 0 30px ${colors.glow}, inset 0 0 30px ${colors.glow}20`
            : 'none',
        };
      case 'holographic':
        return {
          background: `linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(30, 41, 59, 0.8))`,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        };
      case 'aurora':
        return {
          background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        };
      case 'cyberpunk':
        return {
          background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e)',
          border: `1px solid ${colors.primary}80`,
          clipPath:
            'polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
        };
      default:
        return {
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        };
    }
  };

  // Get title display info
  const titleInfo = effectiveTitle ? TITLE_DISPLAY_NAMES[effectiveTitle] : null;

  return (
    <TiltCard
      className="relative"
      maxTilt={8}
      glare={true}
      glareIntensity={0.1}
      glowColor={colors.primary}
      disabled={false}
    >
      <motion.div
        className="relative overflow-hidden rounded-2xl p-4"
        style={{
          ...getBackgroundStyle(),
          boxShadow: settings.glowEnabled ? `0 0 40px ${colors.glow}` : 'none',
        }}
        animate={
          settings.glowEnabled
            ? {
                boxShadow: [
                  `0 0 30px ${colors.glow}`,
                  `0 0 50px ${colors.glow}`,
                  `0 0 30px ${colors.glow}`,
                ],
              }
            : undefined
        }
        transition={{ duration: 3 * speedMultiplier, repeat: Infinity }}
      >
        {/* Particles */}
        {showParticles && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particleData.map((p) => (
              <motion.div
                key={p.id}
                className={`absolute ${getParticleStyle.shape === 'square' ? 'rounded-sm' : 'rounded-full'}`}
                style={{
                  background: getParticleStyle.color,
                  width: `${p.width}px`,
                  height: `${p.height}px`,
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  boxShadow: `0 0 ${p.boxShadow}px ${getParticleStyle.color}`,
                  willChange: 'transform, opacity',
                  transform: 'translateZ(0)',
                }}
                animate={
                  activeProfileTheme?.particleType === 'fire'
                    ? {
                        y: [0, -60],
                        x: [0, (p.id % 2 === 0 ? 1 : -1) * 10],
                        opacity: [0.8, 0],
                        scale: [1, 0.3],
                      }
                    : activeProfileTheme?.particleType === 'snow'
                      ? {
                          y: [0, 80],
                          x: [0, (p.id % 2 === 0 ? 1 : -1) * 15],
                          opacity: [0.8, 0.4, 0.8],
                        }
                      : activeProfileTheme?.particleType === 'rain'
                        ? { y: [0, 100], opacity: [0.6, 0.2] }
                        : { y: [0, -40, 0], opacity: [0.3, 0.9, 0.3], scale: [0.5, 1.2, 0.5] }
                }
                transition={{
                  duration: p.duration * speedMultiplier,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

        {/* Overlay effect for special themes */}
        {activeProfileTheme?.overlayType && activeProfileTheme.overlayType !== 'none' && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                activeProfileTheme.overlayType === 'scanlines'
                  ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
                  : activeProfileTheme.overlayType === 'noise'
                    ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E\")"
                    : activeProfileTheme.overlayType === 'grid'
                      ? 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 11px), repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 11px)'
                      : activeProfileTheme.overlayType === 'holographic'
                        ? 'linear-gradient(45deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1), rgba(255,255,0,0.1))'
                        : 'none',
              opacity: 0.5,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Avatar */}
          <AnimatedAvatar
            borderType={effectiveBorderType}
            borderColor={effectiveColorPreset}
            size={settings.avatarSize}
            speedMultiplier={speedMultiplier}
          />

          {/* Name & Title & Status */}
          <div className="mt-3 text-center">
            <GlowText
              as="h4"
              gradient={[colors.primary, colors.secondary]}
              size="lg"
              animate={true}
              glowIntensity="medium"
            >
              CryptoNinja
            </GlowText>

            {/* Title Display */}
            {titleInfo && (
              <motion.div
                className="mt-1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={effectiveTitle}
              >
                {isLegendaryTitle ? (
                  <FireText size="sm">{titleInfo.name}</FireText>
                ) : (
                  <span className={`text-xs font-medium ${titleInfo.gradient}`}>
                    {titleInfo.name}
                  </span>
                )}
              </motion.div>
            )}

            {settings.showStatus && (
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <motion.span
                  className="h-2 w-2 rounded-full bg-emerald-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    boxShadow: [
                      '0 0 4px rgba(52, 211, 153, 0.5)',
                      '0 0 8px rgba(52, 211, 153, 0.8)',
                      '0 0 4px rgba(52, 211, 153, 0.5)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs text-emerald-400">Online</span>
              </div>
            )}
          </div>

          {/* Badges */}
          {settings.showBadges && (
            <div className="mt-3 flex gap-2">
              {MOCK_BADGES.map((badge, i) => (
                <motion.div
                  key={i}
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                  style={{
                    background: `${badge.color}30`,
                    boxShadow: settings.glowEnabled ? `0 0 10px ${badge.color}50` : 'none',
                  }}
                  animate={
                    settings.glowEnabled
                      ? {
                          boxShadow: [
                            `0 0 10px ${badge.color}50`,
                            `0 0 20px ${badge.color}70`,
                            `0 0 10px ${badge.color}50`,
                          ],
                        }
                      : undefined
                  }
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{
                    ...springs.bouncy,
                    duration: 2,
                    repeat: settings.glowEnabled ? Infinity : 0,
                    delay: i * 0.3,
                  }}
                >
                  <motion.div
                    className="absolute -inset-1 rounded-lg opacity-50"
                    style={{
                      background: `conic-gradient(from 0deg, transparent, ${badge.color}, transparent)`,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="relative z-10">{badge.emoji}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* XP Bar */}
          <div className="mt-4 w-full">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    boxShadow: `0 0 12px ${colors.primary}40`,
                  }}
                  animate={{
                    boxShadow: [
                      `0 0 8px ${colors.primary}40`,
                      `0 0 16px ${colors.primary}60`,
                      `0 0 8px ${colors.primary}40`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  42
                </motion.div>
                <span className="text-xs font-medium text-white/80">Level</span>
              </div>
              <span className="text-xs text-white/60">7,842 / 10,000 XP</span>
            </div>

            {/* XP Progress Bar */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 6px)`,
                }}
              />

              <motion.div
                className="relative h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                  boxShadow: `0 0 10px ${colors.primary}60, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  width: '78%',
                }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </motion.div>

              <motion.div
                className="absolute top-0 h-full w-1 rounded-full blur-sm"
                style={{
                  left: '78%',
                  background: colors.secondary,
                  boxShadow: `0 0 8px ${colors.secondary}`,
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>

            <div className="mt-1 flex justify-end">
              <span className="text-[10px] text-white/40">2,158 XP to Level 43</span>
            </div>
          </div>
        </div>
      </motion.div>
    </TiltCard>
  );
});
