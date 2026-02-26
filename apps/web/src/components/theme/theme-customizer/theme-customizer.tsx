/**
 * ThemeCustomizer Component
 *
 * Comprehensive theme customization panel with live preview.
 * Features:
 * - Color preset selection with visual swatches
 * - Avatar border configuration
 * - Chat bubble style customization
 * - Effect presets (glassmorphism, neon, etc.)
 * - Animation speed controls
 * - Live preview of all changes
 * - Premium feature gating
 * - Export/Import themes
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwatchIcon, EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import {
  useThemeStore,
  type ThemeColorPreset,
  type AvatarBorderType,
  type ChatBubbleStylePreset,
  type EffectPreset,
} from '@/stores/theme';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';

import type { ThemeCustomizerProps, TabId } from './types';
import { TABS, QUICK_PRESETS } from './constants';
import { ColorTab } from './color-tab';
import { AvatarTab } from './avatar-tab';
import { BubblesTab } from './bubbles-tab';
import { EffectsTab } from './effects-tab';
import { LivePreview } from './live-preview';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the theme module.
 */
/**
 * Theme Customizer component.
 */
export function ThemeCustomizer({ onClose, className = '' }: ThemeCustomizerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('colors');
  const [showPreview, setShowPreview] = useState(true);

  const {
    theme,
    updateTheme,
    setColorPreset,
    setAvatarBorder,
    setChatBubbleStyle,
    setEffect,
    setAnimationSpeed,
    toggleParticles,
    toggleGlow,
    resetTheme,
    applyPreset,
  } = useThemeStore();

  const handleColorSelect = useCallback(
    (preset: ThemeColorPreset) => {
      setColorPreset(preset);
      HapticFeedback.light();
    },
    [setColorPreset]
  );

  const handleBorderSelect = useCallback(
    (border: AvatarBorderType) => {
      setAvatarBorder(border);
      HapticFeedback.medium();
    },
    [setAvatarBorder]
  );

  const handleBubbleStyleSelect = useCallback(
    (style: ChatBubbleStylePreset) => {
      setChatBubbleStyle(style);
      HapticFeedback.light();
    },
    [setChatBubbleStyle]
  );

  const handleEffectSelect = useCallback(
    (effect: EffectPreset) => {
      setEffect(effect);
      HapticFeedback.medium();
    },
    [setEffect]
  );

  return (
    <div className={`w-full max-w-4xl ${className}`}>
      <GlassCard variant="crystal" glow className="overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700/50 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <SwatchIcon className="h-6 w-6 text-primary-400" />
              Theme Customizer
            </h2>
            <p className="mt-1 text-sm text-gray-400">Personalize your CGraph experience</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPreview(!showPreview)}
              className={`rounded-lg p-2 transition-colors ${
                showPreview ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400'
              }`}
            >
              <EyeIcon className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetTheme();
                HapticFeedback.warning();
              }}
              className="rounded-lg bg-dark-700 p-2 text-gray-400 transition-colors hover:text-white"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </motion.button>
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="rounded-lg bg-dark-700 px-4 py-2 text-gray-300 transition-colors hover:text-white"
              >
                Done
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-gray-700/50 p-4">
            <nav className="space-y-2">
              {TABS.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'border border-primary-500/30 bg-primary-600/20 text-primary-400'
                      : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* Quick Presets */}
            <div className="mt-8">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Quick Presets
              </h4>
              <div className="space-y-2">
                {QUICK_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.value}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      applyPreset(preset.value);
                      HapticFeedback.success();
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
                  >
                    {preset.name}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'colors' && (
                <ColorTab
                  key="colors"
                  selectedColor={theme.colorPreset}
                  onSelectColor={handleColorSelect}
                />
              )}
              {activeTab === 'avatar' && (
                <AvatarTab
                  key="avatar"
                  selectedBorder={theme.avatarBorder}
                  selectedColor={theme.avatarBorderColor}
                  onSelectBorder={handleBorderSelect}
                  onSelectColor={(color) => updateTheme({ avatarBorderColor: color })}
                  glowEnabled={theme.glowEnabled}
                  onToggleGlow={toggleGlow}
                />
              )}
              {activeTab === 'bubbles' && (
                <BubblesTab
                  key="bubbles"
                  selectedStyle={theme.chatBubbleStyle}
                  selectedColor={theme.chatBubbleColor}
                  bubbleSettings={{
                    radius: theme.bubbleBorderRadius,
                    shadow: theme.bubbleShadowIntensity,
                    glass: theme.bubbleGlassEffect,
                    tail: theme.bubbleShowTail ?? true,
                    hover: theme.bubbleHoverEffect ?? true,
                    entrance: theme.bubbleEntranceAnimation ?? 'slide',
                  }}
                  onSelectStyle={handleBubbleStyleSelect}
                  onSelectColor={(color) => updateTheme({ chatBubbleColor: color })}
                  onUpdateSettings={(settings) => updateTheme(settings)}
                />
              )}
              {activeTab === 'effects' && (
                <EffectsTab
                  key="effects"
                  selectedEffect={theme.effectPreset}
                  animationSpeed={theme.animationSpeed}
                  particlesEnabled={theme.particlesEnabled}
                  onSelectEffect={handleEffectSelect}
                  onSetSpeed={setAnimationSpeed}
                  onToggleParticles={toggleParticles}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Live Preview */}
          <AnimatePresence>
            {showPreview && <LivePreview isVisible={showPreview} />}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
}

export default ThemeCustomizer;
