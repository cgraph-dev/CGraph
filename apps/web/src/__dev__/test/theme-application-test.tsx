/**
 * Theme Application Test Page
 *
 * Interactive testing page for the visual theme application system.
 * Demonstrates all customization effects in real-time.
 *
 * @version 1.0.0
 * @since 2026-01-19
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Avatar } from '@/shared/components/ui';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import {
  getAvatarBorderStyle,
  getMessageBubbleClass,
  getMessageEffectClass,
  getReactionStyleClass,
} from '@/modules/settings/hooks/useCustomizationApplication';

// Reserved for advanced border styling
void getAvatarBorderStyle;

export default function ThemeApplicationTest() {
  const {
    avatarBorder,
    profileTheme,
    bubbleStyle,
    messageEffect,
    reactionStyle,
    particleEffect,
    backgroundEffect,
    animationSpeed,
    updateIdentity,
    updateTheme,
    updateChatStyle,
    updateEffects,
  } = useCustomizationStore();

  const [testMessage, setTestMessage] = useState('Hello! This is a test message.');
  const [showReaction, setShowReaction] = useState(false);

  const testBorders = [
    'none',
    'static',
    'simple-glow',
    'gentle-pulse',
    'rotating-ring',
    'dual-ring',
    'rainbow-spin',
    'particle-orbit',
    'electric-arc',
    'flame-ring',
    'ice-crystal',
    'toxic-glow',
    'holy-light',
    'shadow-wisp',
    'cosmic-drift',
  ];

  const testThemes = [
    'classic-purple',
    'neon-blue',
    'cyberpunk',
    'forest-green',
    'sunset-orange',
    'royal-gold',
  ];

  const testBubbles = [
    'default',
    'rounded',
    'sharp',
    'minimal',
    'glass',
    'neon',
    'retro',
    '3d',
    'outline',
  ];

  const testEffects = ['none', 'slide', 'fade', 'bounce', 'typewriter', 'glitch', 'sparkle'];

  const testReactions = ['bounce', 'pop', 'float', 'spin', 'pulse', 'shake', 'zoom'];

  const testParticles = [
    'none',
    'snow',
    'stars',
    'fireflies',
    'sparkles',
    'confetti',
    'bubbles',
    'rain',
  ];

  const testBackgrounds = [
    'solid',
    'gradient',
    'animated-gradient',
    'particles',
    'mesh',
    'dots',
    'scanlines',
    'vignette',
  ];

  const testSpeeds = ['slow', 'normal', 'fast'];

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">Theme Application Test</h1>
          <p className="text-white/60">
            Interactive testing for all customization effects - changes apply in real-time
          </p>
        </div>

        {/* Avatar Borders Test */}
        <GlassCard variant="crystal" className="p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Avatar Borders</h2>
          <p className="mb-4 text-sm text-white/60">Current: {avatarBorder || 'none'}</p>

          <div className="mb-6 flex justify-center">
            <Avatar
              name="Test User"
              size="xl"
              borderId={avatarBorder}
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=test"
            />
          </div>

          <div className="grid grid-cols-5 gap-3">
            {testBorders.map((border) => (
              <button
                key={border}
                onClick={() => updateIdentity('avatarBorder', border)}
                className={`rounded-lg p-2 text-xs transition-all ${
                  avatarBorder === border
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {border}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Profile Themes Test */}
        <GlassCard variant="crystal" className="p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Profile Themes</h2>
          <p className="mb-4 text-sm text-white/60">Current: {profileTheme}</p>

          <div className="mb-6">
            <div
              className="h-32 rounded-lg"
              style={{
                background: `linear-gradient(135deg, var(--profile-primary), var(--profile-secondary))`,
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {testThemes.map((theme) => (
              <button
                key={theme}
                onClick={() => updateTheme('profileTheme', theme)}
                className={`rounded-lg p-3 text-sm transition-all ${
                  profileTheme === theme
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Message Bubbles Test */}
        <GlassCard variant="crystal" className="p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Message Bubbles & Effects</h2>
          <p className="mb-2 text-sm text-white/60">Bubble: {bubbleStyle}</p>
          <p className="mb-4 text-sm text-white/60">Effect: {messageEffect}</p>

          <div className="mb-6 space-y-4">
            <div className="flex justify-end">
              <motion.div
                className={`max-w-xs px-4 py-2 text-white ${getMessageBubbleClass(bubbleStyle)} ${getMessageEffectClass(messageEffect)}`}
                key={`${bubbleStyle}-${messageEffect}-${testMessage}`}
              >
                {testMessage}
              </motion.div>
            </div>
            <div className="flex">
              <motion.div
                className={`max-w-xs px-4 py-2 text-white ${getMessageBubbleClass(bubbleStyle)} ${getMessageEffectClass(messageEffect)}`}
                key={`reply-${bubbleStyle}-${messageEffect}`}
              >
                This is a reply message
              </motion.div>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-white/60">Bubble Style:</label>
            <div className="grid grid-cols-5 gap-2">
              {testBubbles.map((bubble) => (
                <button
                  key={bubble}
                  onClick={() => updateChatStyle('bubbleStyle', bubble)}
                  className={`rounded p-2 text-xs ${
                    bubbleStyle === bubble
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {bubble}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">Message Effect:</label>
            <div className="grid grid-cols-4 gap-2">
              {testEffects.map((effect) => (
                <button
                  key={effect}
                  onClick={() => {
                    updateChatStyle('messageEffect', effect);
                    setTestMessage(`Test: ${effect} - ${Date.now()}`);
                  }}
                  className={`rounded p-2 text-xs ${
                    messageEffect === effect
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {effect}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Reaction Styles Test */}
        <GlassCard variant="crystal" className="p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Reaction Styles</h2>
          <p className="mb-4 text-sm text-white/60">Current: {reactionStyle}</p>

          <div className="mb-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setShowReaction(!showReaction)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              Toggle Reaction
            </button>

            {showReaction && (
              <motion.div
                className={`text-4xl ${getReactionStyleClass(reactionStyle)}`}
                key={`reaction-${reactionStyle}-${showReaction}`}
              >
                ❤️
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {testReactions.map((reaction) => (
              <button
                key={reaction}
                onClick={() => {
                  updateChatStyle('reactionStyle', reaction);
                  setShowReaction(false);
                  setTimeout(() => setShowReaction(true), 100);
                }}
                className={`rounded-lg p-3 text-sm transition-all ${
                  reactionStyle === reaction
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {reaction}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Effects Test */}
        <GlassCard variant="crystal" className="p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Particle & Background Effects</h2>
          <p className="mb-2 text-sm text-white/60">Particle: {particleEffect}</p>
          <p className="mb-2 text-sm text-white/60">Background: {backgroundEffect}</p>
          <p className="mb-4 text-sm text-white/60">Speed: {animationSpeed}</p>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-white/60">Particle Effect:</label>
            <div className="grid grid-cols-4 gap-2">
              {testParticles.map((particle) => (
                <button
                  key={particle}
                  onClick={() => updateEffects('particleEffect', particle)}
                  className={`rounded p-2 text-xs ${
                    particleEffect === particle
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {particle}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-white/60">Background Effect:</label>
            <div className="grid grid-cols-4 gap-2">
              {testBackgrounds.map((bg) => (
                <button
                  key={bg}
                  onClick={() => updateEffects('backgroundEffect', bg)}
                  className={`rounded p-2 text-xs ${
                    backgroundEffect === bg
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/60">Animation Speed:</label>
            <div className="grid grid-cols-3 gap-3">
              {testSpeeds.map((speed) => (
                <button
                  key={speed}
                  onClick={() => updateEffects('animationSpeed', speed)}
                  className={`rounded-lg p-3 text-sm ${
                    animationSpeed === speed
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* CSS Variables Display */}
        <GlassCard variant="crystal" className="p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">CSS Variables (Live)</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-4">
              <span className="text-white/60">--profile-primary:</span>
              <div className="h-8 w-24 rounded" style={{ background: 'var(--profile-primary)' }} />
              <span className="text-white" id="profile-primary-value"></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/60">--profile-secondary:</span>
              <div
                className="h-8 w-24 rounded"
                style={{ background: 'var(--profile-secondary)' }}
              />
              <span className="text-white" id="profile-secondary-value"></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/60">--animation-speed:</span>
              <span className="text-white">{animationSpeed}</span>
            </div>
          </div>
        </GlassCard>

        {/* Body Classes Display */}
        <GlassCard variant="crystal" className="p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Body Classes (Applied)</h2>
          <div className="space-y-2 font-mono text-sm text-white/80">
            {particleEffect !== 'none' && <div>✓ particle-effect-{particleEffect}</div>}
            {backgroundEffect !== 'solid' && <div>✓ bg-effect-{backgroundEffect}</div>}
            <div>✓ chat-theme-{bubbleStyle}</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
