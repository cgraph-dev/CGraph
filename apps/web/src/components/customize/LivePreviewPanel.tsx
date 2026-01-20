/**
 * Live Preview Panel
 *
 * Real-time preview of all customization settings.
 * Shows profile card, avatar, and chat bubbles with live updates.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useCustomizationStoreV2, themeColors } from '@/stores/customizationStoreV2';

// =============================================================================
// CHAT BUBBLE PREVIEW
// =============================================================================

interface ChatBubbleProps {
  message: string;
  isOwn: boolean;
  timestamp?: string;
}

const ChatBubble = memo(function ChatBubble({ message, isOwn, timestamp }: ChatBubbleProps) {
  const {
    chatBubbleColor,
    bubbleBorderRadius,
    bubbleShadowIntensity,
    bubbleGlassEffect,
    bubbleShowTail,
    bubbleHoverEffect,
    showTimestamps,
  } = useCustomizationStoreV2();

  const colors = themeColors[chatBubbleColor];

  const bubbleStyle = {
    borderRadius: bubbleBorderRadius,
    boxShadow: `0 4px ${bubbleShadowIntensity / 4}px rgba(0, 0, 0, ${bubbleShadowIntensity / 100})`,
    background: isOwn
      ? bubbleGlassEffect
        ? `linear-gradient(135deg, ${colors.primary}90, ${colors.secondary}70)`
        : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
      : bubbleGlassEffect
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.15)',
    backdropFilter: bubbleGlassEffect ? 'blur(10px)' : 'none',
  };

  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={bubbleHoverEffect ? { scale: 1.02, y: -2 } : undefined}
    >
      <div
        className={`relative max-w-[80%] px-3 py-2 ${isOwn ? 'text-white' : 'text-white/90'}`}
        style={bubbleStyle}
      >
        <p className="text-sm">{message}</p>
        {showTimestamps && timestamp && (
          <span className="mt-1 block text-right text-[10px] opacity-60">{timestamp}</span>
        )}

        {/* Bubble tail */}
        {bubbleShowTail && (
          <div
            className={`absolute bottom-0 h-3 w-3 ${isOwn ? '-right-1' : '-left-1'}`}
            style={{
              background: isOwn
                ? bubbleGlassEffect
                  ? `${colors.secondary}70`
                  : colors.secondary
                : bubbleGlassEffect
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
  const {
    themePreset,
    effectPreset,
    avatarBorderType,
    avatarBorderColor,
    avatarSize,
    particlesEnabled,
    glowEnabled,
    blurEnabled,
    showBadges,
    showStatus,
    animationSpeed,
  } = useCustomizationStoreV2();

  const colors = themeColors[themePreset];
  const speedMultiplier = animationSpeed === 'slow' ? 2 : animationSpeed === 'fast' ? 0.5 : 1;

  // Effect background styles
  const getBackgroundStyle = () => {
    switch (effectPreset) {
      case 'glassmorphism':
        return {
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: blurEnabled ? 'blur(20px)' : 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        };
      case 'neon':
        return {
          background: 'rgba(0, 0, 0, 0.9)',
          border: `1px solid ${colors.primary}`,
          boxShadow: glowEnabled
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
      default: // minimal
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

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        ...getBackgroundStyle(),
        boxShadow: glowEnabled ? `0 0 40px ${colors.glow}` : 'none',
      }}
      animate={
        glowEnabled
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
      {particlesEnabled && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 * speedMultiplier,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Avatar */}
        <AnimatedAvatar
          borderType={avatarBorderType}
          borderColor={avatarBorderColor}
          size={avatarSize}
          speedMultiplier={speedMultiplier}
        />

        {/* Name & Status */}
        <div className="mt-3 text-center">
          <h4 className="font-semibold text-white">CryptoNinja</h4>
          {showStatus && (
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400">Online</span>
            </div>
          )}
        </div>

        {/* Badges */}
        {showBadges && (
          <div className="mt-3 flex gap-2">
            {mockBadges.map((badge, i) => (
              <motion.div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                style={{
                  background: `${badge.color}30`,
                  boxShadow: glowEnabled ? `0 0 10px ${badge.color}50` : 'none',
                }}
                animate={
                  glowEnabled
                    ? {
                        boxShadow: [
                          `0 0 10px ${badge.color}50`,
                          `0 0 20px ${badge.color}70`,
                          `0 0 10px ${badge.color}50`,
                        ],
                      }
                    : undefined
                }
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                {badge.emoji}
              </motion.div>
            ))}
          </div>
        )}

        {/* XP Bar */}
        <div className="mt-4 w-full">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-white/60">Level 42</span>
            <span className="text-white/60">7,842 / 10,000 XP</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: '78%' }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// =============================================================================
// MAIN LIVE PREVIEW PANEL
// =============================================================================

export const LivePreviewPanel = memo(function LivePreviewPanel() {
  const { themePreset, isSaving, isDirty } = useCustomizationStoreV2();
  const colors = themeColors[themePreset];

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
