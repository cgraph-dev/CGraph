/**
 * ProfileCardPreview - Profile card preview with live customization
 */

import { durations } from '@cgraph/animation-constants';
import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import {
  useCustomizationStore,
  THEME_COLORS as themeColors,
  BORDER_ID_TO_TYPE,
  PROFILE_THEME_TO_COLOR,
  TITLE_DISPLAY_NAMES,
} from '@/modules/settings/store/customization';
import { usePrefersReducedMotion } from '@/hooks';
import { getThemeById, type ProfileThemeConfig } from '@/data/profileThemes';
import { getBorderById } from '@/data/borderCollections';
import { TiltCard } from '@/shared/components/ui';
import { LottieOverlay } from '@/components/lottie';
import { ANIMATION_SPEED_MULTIPLIERS, LEGENDARY_TITLE_IDS } from './constants';
import { getBackgroundStyle, getParticleStyle as computeParticleStyle } from './profile-card-utils';
import { ParticleField } from './particle-field';
import { ProfileContent } from './profile-content';
import type { ParticleData } from './types';

export const ProfileCardPreview = memo(function ProfileCardPreview() {
  const prefersReducedMotion = usePrefersReducedMotion();

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
      avatarBorderType: state.avatarBorderType,
      selectedProfileThemeId: state.selectedProfileThemeId,
      particleEffect: state.particleEffect,
      // Display name style
      displayNameFont: state.displayNameFont,
      displayNameEffect: state.displayNameEffect,
      displayNameColor: state.displayNameColor,
      displayNameSecondaryColor: state.displayNameSecondaryColor,
      // Nameplate & effects
      equippedNameplate: state.equippedNameplate,
      equippedProfileEffect: state.equippedProfileEffect,
      // Profile theme preset
      profileThemePresetId: state.profileThemePresetId,
      profileThemePrimary: state.profileThemePrimary,
      profileThemeAccent: state.profileThemeAccent,
    }))
  );

  const effectiveTitle = settings.equippedTitle || null;

  const effectiveBorderId = settings.selectedBorderId || settings.avatarBorderType;
  const borderDef = effectiveBorderId ? getBorderById(effectiveBorderId) : undefined;
  const borderLottieUrl = borderDef?.lottieFile ?? undefined;
  const effectiveBorderType = effectiveBorderId
    ? borderLottieUrl
      ? ('lottie' as const)
      : BORDER_ID_TO_TYPE[effectiveBorderId] || settings.avatarBorderType
    : settings.avatarBorderType;

  const effectiveColorPreset =
    (settings.profileTheme && PROFILE_THEME_TO_COLOR[settings.profileTheme]) ||
    settings.avatarBorderColor;

  const activeProfileTheme = useMemo<ProfileThemeConfig | null>(() => {
    return settings.profileTheme ? (getThemeById(settings.profileTheme) ?? null) : null;
  }, [settings.profileTheme]);

  const showParticles =
    !prefersReducedMotion &&
    (settings.particleEffect !== 'none' ||
      settings.particlesEnabled ||
      activeProfileTheme?.particleType !== 'none');

  const isLegendaryTitle = effectiveTitle && LEGENDARY_TITLE_IDS.includes(effectiveTitle);

  const colors = themeColors[effectiveColorPreset];
  const speedMultiplier = ANIMATION_SPEED_MULTIPLIERS[settings.animationSpeed];

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

  const particleStyle = useMemo(
    () => computeParticleStyle(activeProfileTheme, colors.primary),
    [activeProfileTheme, colors.primary]
  );

  const titleInfo = effectiveTitle ? (TITLE_DISPLAY_NAMES[effectiveTitle] ?? null) : null;

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
          ...getBackgroundStyle(settings, colors, activeProfileTheme),
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
        transition={{
          duration: (durations.cinematic.ms / 1000) * speedMultiplier,
          repeat: Infinity,
        }}
      >
        <ParticleField
          show={showParticles}
          particleData={particleData}
          particleStyle={particleStyle}
          activeProfileTheme={activeProfileTheme}
          speedMultiplier={speedMultiplier}
        />

        <ProfileContent
          settings={settings}
          colors={colors}
          effectiveBorderType={effectiveBorderType}
          effectiveColorPreset={effectiveColorPreset}
          effectiveTitle={effectiveTitle}
          titleInfo={titleInfo}
          isLegendaryTitle={!!isLegendaryTitle}
          speedMultiplier={speedMultiplier}
          equippedBadges={settings.equippedBadges}
          lottieUrl={borderLottieUrl}
        />

        {/* Profile effect overlay (sparkles, snow, fire, etc.) */}
        <LottieOverlay
          effectId={settings.equippedProfileEffect ?? null}
          speed={speedMultiplier}
        />
      </motion.div>
    </TiltCard>
  );
});
