/**
 * Live Preview Panel
 *
 * Real-time preview of all customization settings.
 * Shows profile card, avatar, and chat bubbles with live updates.
 * 
 * IMPORTANT: This component syncs with BOTH customization stores:
 * - customizationStore (V1): Used by IdentityCustomization, ThemeCustomization, etc.
 * - customizationStoreV2: Used for advanced settings and local persistence
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useCustomizationStoreV2, themeColors, type ThemePreset, type AvatarBorderType } from '@/stores/customizationStoreV2';
import { useCustomizationStore } from '@/stores/customizationStore';

// Import profile themes data for enhanced background rendering
import { getThemeById, type ProfileThemeConfig } from '@/data/profileThemes';

// Animation presets for chat bubbles
import { springs, chatBubbleAnimations, hoverAnimations } from '@/lib/animationPresets';

// Import enhanced UI components
import TiltCard from '@/components/ui/TiltCard';
import GlowText, { FireText } from '@/components/ui/GlowText';

// Title display names mapping
const TITLE_DISPLAY_NAMES: Record<string, { name: string; gradient: string }> = {
  't1': { name: 'Newbie', gradient: 'text-gray-400' },
  't2': { name: 'Adventurer', gradient: 'text-blue-400' },
  't3': { name: 'Veteran', gradient: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent' },
  't4': { name: 'Elite', gradient: 'bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent' },
  't5': { name: 'Legend', gradient: 'bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent' },
  't6': { name: 'Mythic Hero', gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent' },
};

// Border ID to type mapping for V1 store integration
const BORDER_ID_TO_TYPE: Record<string, AvatarBorderType> = {
  'b1': 'static',
  'b2': 'static',
  'b3': 'static',
  'b4': 'static',
  'b5': 'pulse',
  'b6': 'rotate',
  'b7': 'glow',
  'b8': 'electric',
  'b9': 'rotate',
  'b10': 'fire',
  'b11': 'ice',
  'b12': 'glow',
  'b13': 'fire',
  'b14': 'legendary',
  'b15': 'mythic',
  'b16': 'fire',
  'b17': 'mythic',
  'b18': 'legendary',
};

// Profile theme to color mapping
const PROFILE_THEME_TO_COLOR: Record<string, ThemePreset> = {
  'profile-default': 'purple',
  'classic-purple': 'purple',
  'profile-ocean': 'cyan',
  'profile-forest': 'emerald',
  'profile-sunset': 'orange',
  'profile-midnight': 'purple',
  'profile-cherry': 'pink',
};

// =============================================================================
// CHAT BUBBLE PREVIEW
// =============================================================================

interface ChatBubbleProps {
  message: string;
  isOwn: boolean;
  timestamp?: string;
}

const ChatBubble = memo(function ChatBubble({ message, isOwn, timestamp }: ChatBubbleProps) {
  // Get settings from V2 store with shallow comparison to prevent infinite loops
  const v2Settings = useCustomizationStoreV2(useShallow((state) => ({
    chatBubbleColor: state.chatBubbleColor,
    bubbleBorderRadius: state.bubbleBorderRadius,
    bubbleShadowIntensity: state.bubbleShadowIntensity,
    bubbleGlassEffect: state.bubbleGlassEffect,
    bubbleShowTail: state.bubbleShowTail,
    bubbleHoverEffect: state.bubbleHoverEffect,
    showTimestamps: state.showTimestamps,
    bubbleEntranceAnimation: state.bubbleEntranceAnimation,
  })));
  
  // Get settings from V1 store for chat theme integration
  const v1Settings = useCustomizationStore(useShallow((state) => ({
    chatTheme: state.chatTheme,
    bubbleStyle: state.bubbleStyle,
    messageEffect: state.messageEffect,
  })));

  // Determine colors - prefer V1 chat theme if it's a specific theme
  const chatThemeToColor: Record<string, ThemePreset> = {
    'chat-default': 'purple',
    'chat-discord': 'purple',
    'chat-telegram': 'cyan',
    'chat-neon': 'pink',
    'chat-minimal': 'emerald',
    'default': 'emerald',
  };
  
  const effectiveColorPreset = chatThemeToColor[v1Settings.chatTheme] || v2Settings.chatBubbleColor;
  const colors = themeColors[effectiveColorPreset];

  // Get style-specific entrance animation
  const bubbleStyleKey = v1Settings.bubbleStyle || 'default';
  const defaultAnimation = chatBubbleAnimations['default']!;
  const getEntranceAnimation = chatBubbleAnimations[bubbleStyleKey];
  const entranceAnimation = (getEntranceAnimation ?? defaultAnimation)(isOwn, 0);

  const bubbleStyle = {
    borderRadius: v2Settings.bubbleBorderRadius,
    boxShadow: `0 4px ${v2Settings.bubbleShadowIntensity / 4}px rgba(0, 0, 0, ${v2Settings.bubbleShadowIntensity / 100})`,
    background: isOwn
      ? v2Settings.bubbleGlassEffect
        ? `linear-gradient(135deg, ${colors.primary}90, ${colors.secondary}70)`
        : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
      : v2Settings.bubbleGlassEffect
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.15)',
    backdropFilter: v2Settings.bubbleGlassEffect ? 'blur(10px)' : 'none',
  };

  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      initial={entranceAnimation.initial}
      animate={entranceAnimation.animate}
      transition={entranceAnimation.transition}
      whileHover={v2Settings.bubbleHoverEffect ? hoverAnimations.lift : undefined}
    >
      <div
        className={`relative max-w-[80%] px-3 py-2 ${isOwn ? 'text-white' : 'text-white/90'}`}
        style={bubbleStyle}
      >
        <p className="text-sm">{message}</p>
        {v2Settings.showTimestamps && timestamp && (
          <span className="mt-1 block text-right text-[10px] opacity-60">{timestamp}</span>
        )}

        {/* Bubble tail */}
        {v2Settings.bubbleShowTail && (
          <div
            className={`absolute bottom-0 h-3 w-3 ${isOwn ? '-right-1' : '-left-1'}`}
            style={{
              background: isOwn
                ? v2Settings.bubbleGlassEffect
                  ? `${colors.secondary}70`
                  : colors.secondary
                : v2Settings.bubbleGlassEffect
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.15)',
              borderRadius: isOwn ? '0 0 0 8px' : '0 0 8px 0',
              transform: isOwn ? 'skewX(-15deg)' : 'skewX(15deg)',
            }}
          />
        )}
      </div>
    </motion.div>
  );
});

// =============================================================================
// PROFILE CARD PREVIEW
// =============================================================================

const ProfileCardPreview = memo(function ProfileCardPreview() {
  // Get settings from V2 store with shallow comparison to prevent infinite loops
  const v2Settings = useCustomizationStoreV2(useShallow((state) => ({
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
  })));

  // Get settings from V1 store for full integration
  const v1Settings = useCustomizationStore(useShallow((state) => ({
    avatarBorder: state.avatarBorder,
    title: state.title,
    equippedBadges: state.equippedBadges,
    profileLayout: state.profileLayout,
    profileTheme: state.profileTheme,
    particleEffect: state.particleEffect,
    backgroundEffect: state.backgroundEffect,
  })));

  // Merge settings: V1 store takes priority for identity items
  const effectiveTitle = v1Settings.title || v2Settings.equippedTitle;
  const _effectiveBadges = v1Settings.equippedBadges.length > 0 ? v1Settings.equippedBadges : v2Settings.equippedBadges;
  void _effectiveBadges; // Reserved for future badge display integration
  
  // Determine avatar border type from V1 border ID or fall back to V2
  const effectiveBorderType = v1Settings.avatarBorder 
    ? (BORDER_ID_TO_TYPE[v1Settings.avatarBorder] || v2Settings.avatarBorderType)
    : v2Settings.avatarBorderType;
    
  // Determine color from profile theme
  const effectiveColorPreset = PROFILE_THEME_TO_COLOR[v1Settings.profileTheme] || v2Settings.avatarBorderColor;
  
  // Look up the active profile theme config (for new enhanced themes)
  const activeProfileTheme = useMemo<ProfileThemeConfig | null>(() => {
    return getThemeById(v1Settings.profileTheme) || null;
  }, [v1Settings.profileTheme]);
  
  // Check if particles should be shown
  const showParticles = v1Settings.particleEffect !== 'none' || v2Settings.particlesEnabled || activeProfileTheme?.particleType !== 'none';
  
  // Check if this is a legendary/mythic title for fire effect
  const isLegendaryTitle = effectiveTitle && ['t5', 't6', 't14', 't15', 't16', 't17', 't18'].includes(effectiveTitle);

  const colors = themeColors[effectiveColorPreset];
  const speedMultiplier = v2Settings.animationSpeed === 'slow' ? 2 : v2Settings.animationSpeed === 'fast' ? 0.5 : 1;

  // Get particle style based on active theme
  const getParticleStyle = useMemo(() => {
    if (activeProfileTheme?.particleType) {
      const particleColors: Record<string, string> = {
        pixel: '#00ff00',
        petal: '#ffb7c5',
        energy: '#8b5cf6',
        neon: '#00ffff',
        smoke: '#374151',
        stars: '#fbbf24',
        hearts: '#ec4899',
        sparkles: '#f59e0b',
        snow: '#e5e7eb',
        rain: '#60a5fa',
        bubbles: '#34d399',
        fire: '#ef4444',
        lightning: '#facc15',
        leaves: '#22c55e',
        confetti: '#8b5cf6',
      };
      return {
        color: particleColors[activeProfileTheme.particleType] || colors.primary,
        shape: activeProfileTheme.particleType === 'pixel' ? 'square' : 'circle',
      };
    }
    return { color: colors.primary, shape: 'circle' };
  }, [activeProfileTheme, colors.primary]);

  // Effect background styles - enhanced with new profile themes
  const getBackgroundStyle = () => {
    // Use new profile theme gradient if available
    if (activeProfileTheme?.backgroundGradient && activeProfileTheme.backgroundGradient.length > 0) {
      const gradientColors = activeProfileTheme.backgroundGradient.join(', ');
      return {
        background: `linear-gradient(135deg, ${gradientColors})`,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: activeProfileTheme.glowEnabled ? `0 0 40px ${colors.primary}40` : 'none',
      };
    }
    
    // Check V1 background effect first
    const bgEffect = v1Settings.backgroundEffect || v2Settings.effectPreset;
    
    switch (bgEffect) {
      case 'glassmorphism':
      case 'glass':
        return {
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: v2Settings.blurEnabled ? 'blur(20px)' : 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        };
      case 'neon':
        return {
          background: 'rgba(0, 0, 0, 0.9)',
          border: `1px solid ${colors.primary}`,
          boxShadow: v2Settings.glowEnabled
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
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}30)`,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        };
      default: // minimal, solid
        return {
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        };
    }
  };

  const mockBadges = [
    { emoji: '🛡️', color: '#f59e0b' },
    { emoji: '⚔️', color: '#8b5cf6' },
    { emoji: '👑', color: '#ec4899' },
  ];

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
          boxShadow: v2Settings.glowEnabled ? `0 0 40px ${colors.glow}` : 'none',
        }}
        animate={
          v2Settings.glowEnabled
            ? {
                boxShadow: [
                  `0 0 30px ${colors.glow}`,
                  `0 0 50px ${colors.glow}`,
                  `0 0 30px ${colors.glow}`,
                ],
              }
            : undefined
        }
        transition={{ duration: 3 * speedMultiplier, repeat: Infinity }}>
        {/* Particles - Enhanced with theme-specific styles */}
        {showParticles && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className={`absolute ${getParticleStyle.shape === 'square' ? 'rounded-sm' : 'rounded-full'}`}
                style={{
                  background: getParticleStyle.color,
                  width: `${3 + Math.random() * 4}px`,
                  height: `${3 + Math.random() * 4}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  boxShadow: `0 0 ${4 + Math.random() * 8}px ${getParticleStyle.color}`,
                }}
                animate={
                  activeProfileTheme?.particleType === 'fire'
                    ? { y: [0, -60], x: [0, (Math.random() - 0.5) * 20], opacity: [0.8, 0], scale: [1, 0.3] }
                    : activeProfileTheme?.particleType === 'snow'
                      ? { y: [0, 80], x: [0, (Math.random() - 0.5) * 30], opacity: [0.8, 0.4, 0.8] }
                      : activeProfileTheme?.particleType === 'rain'
                        ? { y: [0, 100], opacity: [0.6, 0.2] }
                        : { y: [0, -40, 0], opacity: [0.3, 0.9, 0.3], scale: [0.5, 1.2, 0.5] }
                }
                transition={{
                  duration: (2 + Math.random() * 2) * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
        
        {/* Overlay effect for special themes */}
        {activeProfileTheme?.overlayType && activeProfileTheme.overlayType !== 'none' && (
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: activeProfileTheme.overlayType === 'scanlines' 
                ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
                : activeProfileTheme.overlayType === 'noise'
                  ? 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.1\'/%3E%3C/svg%3E")'
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
            size={v2Settings.avatarSize}
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
                  <FireText size="sm">
                    {titleInfo.name}
                  </FireText>
                ) : (
                  <span className={`text-xs font-medium ${titleInfo.gradient}`}>
                    {titleInfo.name}
                  </span>
                )}
              </motion.div>
            )}
            
            {v2Settings.showStatus && (
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

          {/* Badges - Enhanced with rotating glow ring */}
          {v2Settings.showBadges && (
            <div className="mt-3 flex gap-2">
              {mockBadges.map((badge, i) => (
                <motion.div
                  key={i}
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                  style={{
                    background: `${badge.color}30`,
                    boxShadow: v2Settings.glowEnabled ? `0 0 10px ${badge.color}50` : 'none',
                  }}
                  animate={
                    v2Settings.glowEnabled
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
                  transition={{ ...springs.bouncy, duration: 2, repeat: v2Settings.glowEnabled ? Infinity : 0, delay: i * 0.3 }}
                >
                  {/* Rotating glow ring for badges */}
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

        {/* Gaming-Style XP Bar */}
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
          
          {/* XP Progress Bar with glow */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            {/* Background pattern */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 6px)`,
              }}
            />
            
            {/* Progress fill */}
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
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
            </motion.div>
            
            {/* Glowing edge */}
            <motion.div
              className="absolute top-0 h-full w-1 rounded-full blur-sm"
              style={{
                left: '78%',
                background: colors.secondary,
                boxShadow: `0 0 8px ${colors.secondary}`,
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          
          {/* Next level indicator */}
          <div className="mt-1 flex justify-end">
            <span className="text-[10px] text-white/40">2,158 XP to Level 43</span>
          </div>
        </div>
      </div>
    </motion.div>
    </TiltCard>
  );
});

// =============================================================================
// MAIN LIVE PREVIEW PANEL
// =============================================================================

export const LivePreviewPanel = memo(function LivePreviewPanel() {
  // Get V2 store states with shallow comparison
  const v2Settings = useCustomizationStoreV2(useShallow((state) => ({
    themePreset: state.themePreset,
    isSaving: state.isSaving,
    isDirty: state.isDirty,
  })));
  
  // Get V1 store states with shallow comparison
  const v1Settings = useCustomizationStore(useShallow((state) => ({
    profileTheme: state.profileTheme,
    isSaving: state.isSaving,
    avatarBorder: state.avatarBorder,
    title: state.title,
  })));

  // Combine saving states from both stores
  const isSaving = v1Settings.isSaving || v2Settings.isSaving;
  
  // Determine if there are unsaved changes (any store has changes)
  const isDirty = v2Settings.isDirty;
  
  // Determine effective color from profile theme
  const effectiveColorPreset = PROFILE_THEME_TO_COLOR[v1Settings.profileTheme] || v2Settings.themePreset;
  const colors = themeColors[effectiveColorPreset];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Live Preview</h3>
          <p className="text-xs text-white/60">See your changes in real-time</p>
        </div>

        {/* Sync indicator */}
        <AnimatePresence mode="wait">
          {isSaving ? (
            <motion.div
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-2 py-1"
            >
              <motion.div
                className="h-2 w-2 rounded-full bg-yellow-400"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              <span className="text-[10px] text-yellow-400">Saving...</span>
            </motion.div>
          ) : isDirty ? (
            <motion.div
              key="unsaved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-orange-500/20 px-2 py-1"
            >
              <div className="h-2 w-2 rounded-full bg-orange-400" />
              <span className="text-[10px] text-orange-400">Unsaved</span>
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-1"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400">Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Preview */}
      <div className="mb-6">
        <ProfileCardPreview />
      </div>

      {/* Chat Preview */}
      <div className="flex-1 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="mb-3 text-xs font-medium text-white/60">Chat Preview</div>
        <div className="space-y-3">
          <ChatBubble message="Hey, nice profile!" isOwn={false} timestamp="12:34" />
          <ChatBubble message="Thanks! Just customized it 🎨" isOwn={true} timestamp="12:35" />
          <ChatBubble message="The border effect looks amazing" isOwn={false} timestamp="12:36" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">Active Theme</span>
          <span className="font-medium" style={{ color: colors.primary }}>
            {colors.name}
          </span>
        </div>
      </div>
    </div>
  );
});

export default LivePreviewPanel;
