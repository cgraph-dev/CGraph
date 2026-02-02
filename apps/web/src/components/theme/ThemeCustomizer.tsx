import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SwatchIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

// Reserved for future use
void useMemo;
import {
  useThemeStore,
  THEME_COLORS,
  type ThemeColorPreset,
  type AvatarBorderType,
  type ChatBubbleStylePreset,
  type EffectPreset,
} from '@/stores/theme';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from './ThemedAvatar';
import { ThemedChatBubble } from './ThemedChatBubble';
import { PremiumThemeGate, TierBadge } from './PremiumThemeGate';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

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

interface ThemeCustomizerProps {
  onClose?: () => void;
  className?: string;
}

const tabs = [
  { id: 'colors', label: 'Colors', icon: SwatchIcon },
  { id: 'avatar', label: 'Avatar', icon: SparklesIcon },
  { id: 'bubbles', label: 'Bubbles', icon: SparklesIcon },
  { id: 'effects', label: 'Effects', icon: AdjustmentsHorizontalIcon },
] as const;

type TabId = (typeof tabs)[number]['id'];

// Border types with tier requirements
const avatarBorderOptions: Array<{
  value: AvatarBorderType;
  label: string;
  tier: 'free' | 'premium' | 'elite';
}> = [
  { value: 'none', label: 'None', tier: 'free' },
  { value: 'static', label: 'Static', tier: 'free' },
  { value: 'glow', label: 'Glow', tier: 'free' },
  { value: 'pulse', label: 'Pulse', tier: 'premium' },
  { value: 'rotate', label: 'Rotate', tier: 'premium' },
  { value: 'fire', label: 'Fire', tier: 'premium' },
  { value: 'ice', label: 'Ice', tier: 'premium' },
  { value: 'electric', label: 'Electric', tier: 'premium' },
  { value: 'legendary', label: 'Legendary', tier: 'elite' },
  { value: 'mythic', label: 'Mythic', tier: 'elite' },
];

const bubbleStyleOptions: Array<{
  value: ChatBubbleStylePreset;
  label: string;
  tier: 'free' | 'premium' | 'elite';
}> = [
  { value: 'default', label: 'Default', tier: 'free' },
  { value: 'rounded', label: 'Rounded', tier: 'free' },
  { value: 'sharp', label: 'Sharp', tier: 'free' },
  { value: 'cloud', label: 'Cloud', tier: 'premium' },
  { value: 'modern', label: 'Modern', tier: 'premium' },
  { value: 'retro', label: 'Retro', tier: 'premium' },
  { value: 'bubble', label: 'Bubble', tier: 'premium' },
  { value: 'glassmorphism', label: 'Glass', tier: 'elite' },
];

const effectOptions: Array<{
  value: EffectPreset;
  label: string;
  description: string;
  tier: 'free' | 'premium' | 'elite';
}> = [
  { value: 'minimal', label: 'Minimal', description: 'Clean and simple', tier: 'free' },
  {
    value: 'glassmorphism',
    label: 'Glassmorphism',
    description: 'Frosted glass effect',
    tier: 'free',
  },
  { value: 'neon', label: 'Neon', description: 'Vibrant glow effects', tier: 'premium' },
  { value: 'aurora', label: 'Aurora', description: 'Flowing color waves', tier: 'premium' },
  {
    value: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Futuristic tech aesthetic',
    tier: 'elite',
  },
  {
    value: 'holographic',
    label: 'Holographic',
    description: 'Rainbow light effects',
    tier: 'elite',
  },
];

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

  // Quick presets
  const quickPresets = [
    { name: 'Minimal', value: 'minimal' as const },
    { name: 'Modern', value: 'modern' as const },
    { name: 'Vibrant', value: 'vibrant' as const },
    { name: 'Elegant', value: 'elegant' as const },
    { name: 'Gaming', value: 'gaming' as const },
  ];

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
              {tabs.map((tab) => (
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
                {quickPresets.map((preset) => (
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
            {showPreview && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden border-l border-gray-700/50 p-6"
              >
                <h4 className="mb-4 text-sm font-semibold text-gray-400">Live Preview</h4>

                {/* Avatar Preview */}
                <div className="mb-6">
                  <p className="mb-2 text-xs text-gray-500">Avatar</p>
                  <div className="flex justify-center">
                    <ThemedAvatar src="/placeholder-avatar.jpg" alt="Preview" size="xlarge" />
                  </div>
                </div>

                {/* Chat Preview */}
                <div className="space-y-3">
                  <p className="mb-2 text-xs text-gray-500">Chat Bubbles</p>
                  <ThemedChatBubble
                    message="Hey! How's it going? 👋"
                    timestamp="2:34 PM"
                    isOwn={false}
                    userName="Alex"
                    showAvatar={false}
                  />
                  <ThemedChatBubble
                    message="I'm doing great! Love the new theme 🎨"
                    timestamp="2:35 PM"
                    isOwn={true}
                    showAvatar={false}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
}

// Color Tab Component
function ColorTab({
  selectedColor,
  onSelectColor,
}: {
  selectedColor: ThemeColorPreset;
  onSelectColor: (color: ThemeColorPreset) => void;
}) {
  const colors = Object.entries(THEME_COLORS) as [
    ThemeColorPreset,
    (typeof THEME_COLORS)[ThemeColorPreset],
  ][];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Color Presets</h3>
      <p className="mb-6 text-sm text-gray-400">Choose a color theme that represents your style</p>

      <div className="grid grid-cols-4 gap-4">
        {colors.map(([preset, config]) => (
          <motion.button
            key={preset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectColor(preset)}
            className={`relative rounded-xl p-4 transition-all ${
              selectedColor === preset
                ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800'
                : 'hover:bg-dark-700'
            }`}
          >
            <div
              className="mb-2 aspect-square w-full rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${config.primary}, ${config.secondary})`,
                boxShadow: `0 4px 20px ${config.glow}`,
              }}
            />
            <span className="text-sm font-medium text-gray-300">{config.name}</span>
            {selectedColor === preset && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white"
              >
                <CheckIcon className="h-3 w-3 text-dark-900" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Avatar Tab Component
function AvatarTab({
  selectedBorder,
  selectedColor,
  onSelectBorder,
  onSelectColor,
  glowEnabled,
  onToggleGlow,
}: {
  selectedBorder: AvatarBorderType;
  selectedColor: ThemeColorPreset;
  onSelectBorder: (border: AvatarBorderType) => void;
  onSelectColor: (color: ThemeColorPreset) => void;
  glowEnabled: boolean;
  onToggleGlow: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Avatar Border</h3>
      <p className="mb-6 text-sm text-gray-400">Customize how your avatar appears to others</p>

      {/* Border Types */}
      <div className="mb-8 grid grid-cols-5 gap-3">
        {avatarBorderOptions.map((option) => {
          const isPremium = option.tier !== 'free';
          const isSelected = selectedBorder === option.value;

          const content = (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !isPremium && onSelectBorder(option.value)}
              disabled={isPremium}
              className={`relative rounded-xl p-3 transition-all ${
                isSelected
                  ? 'bg-primary-600/20 ring-2 ring-primary-500'
                  : 'bg-dark-700 hover:bg-dark-600'
              } ${isPremium ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="text-center">
                <span className="text-sm font-medium text-gray-300">{option.label}</span>
                <TierBadge tier={option.tier} />
              </div>
            </motion.button>
          );

          if (isPremium) {
            return (
              <PremiumThemeGate
                key={option.value}
                requiredTier={option.tier}
                featureName={`${option.label} border`}
                showPreview={false}
              >
                {content}
              </PremiumThemeGate>
            );
          }

          return <div key={option.value}>{content}</div>;
        })}
      </div>

      {/* Border Color */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-gray-400">Border Color</h4>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(THEME_COLORS) as ThemeColorPreset[]).map((preset) => (
            <motion.button
              key={preset}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelectColor(preset)}
              className={`h-8 w-8 rounded-full ${
                selectedColor === preset
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800'
                  : ''
              }`}
              style={{ backgroundColor: THEME_COLORS[preset].primary }}
            />
          ))}
        </div>
      </div>

      {/* Glow Toggle */}
      <div className="flex items-center justify-between rounded-xl bg-dark-700 p-4">
        <div>
          <span className="font-medium text-white">Glow Effect</span>
          <p className="text-xs text-gray-400">Add ambient glow around your avatar</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleGlow}
          className={`h-6 w-12 rounded-full transition-colors ${
            glowEnabled ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            animate={{ x: glowEnabled ? 24 : 0 }}
            className="h-6 w-6 rounded-full bg-white shadow-lg"
          />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Bubbles Tab Component
function BubblesTab({
  selectedStyle,
  selectedColor,
  bubbleSettings,
  onSelectStyle,
  onSelectColor,
  onUpdateSettings,
}: {
  selectedStyle: ChatBubbleStylePreset;
  selectedColor: ThemeColorPreset;
  bubbleSettings: {
    radius: number;
    shadow: number;
    glass: boolean;
    tail: boolean;
    hover: boolean;
    entrance: string;
  };
  onSelectStyle: (style: ChatBubbleStylePreset) => void;
  onSelectColor: (color: ThemeColorPreset) => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Chat Bubbles</h3>
      <p className="mb-6 text-sm text-gray-400">
        Customize your message appearance in conversations
      </p>

      {/* Bubble Styles */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {bubbleStyleOptions.map((option) => {
          const isPremium = option.tier !== 'free';

          return (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !isPremium && onSelectStyle(option.value)}
              disabled={isPremium}
              className={`rounded-xl p-3 text-center transition-all ${
                selectedStyle === option.value
                  ? 'bg-primary-600/20 ring-2 ring-primary-500'
                  : 'bg-dark-700 hover:bg-dark-600'
              } ${isPremium ? 'opacity-60' : ''}`}
            >
              <span className="text-sm font-medium text-gray-300">{option.label}</span>
              {option.tier !== 'free' && (
                <div className="mt-1">
                  <TierBadge tier={option.tier} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bubble Color */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-gray-400">Bubble Color</h4>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(THEME_COLORS) as ThemeColorPreset[]).map((preset) => (
            <motion.button
              key={preset}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelectColor(preset)}
              className={`h-8 w-8 rounded-full ${
                selectedColor === preset
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800'
                  : ''
              }`}
              style={{ backgroundColor: THEME_COLORS[preset].primary }}
            />
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-400">Advanced Settings</h4>

        {/* Border Radius Slider */}
        <div>
          <label className="text-xs text-gray-500">Border Radius: {bubbleSettings.radius}px</label>
          <input
            type="range"
            min="0"
            max="50"
            value={bubbleSettings.radius}
            onChange={(e) => onUpdateSettings({ bubbleBorderRadius: Number(e.target.value) })}
            className="w-full accent-primary-500"
          />
        </div>

        {/* Shadow Intensity Slider */}
        <div>
          <label className="text-xs text-gray-500">
            Shadow Intensity: {bubbleSettings.shadow}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={bubbleSettings.shadow}
            onChange={(e) => onUpdateSettings({ bubbleShadowIntensity: Number(e.target.value) })}
            className="w-full accent-primary-500"
          />
        </div>

        {/* Toggle Options */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'bubbleGlassEffect', label: 'Glass Effect', value: bubbleSettings.glass },
            { key: 'bubbleShowTail', label: 'Show Tail', value: bubbleSettings.tail },
            { key: 'bubbleHoverEffect', label: 'Hover Effect', value: bubbleSettings.hover },
          ].map((toggle) => (
            <motion.button
              key={toggle.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdateSettings({ [toggle.key]: !toggle.value })}
              className={`rounded-xl p-3 text-center transition-all ${
                toggle.value ? 'border border-primary-500/50 bg-primary-600/20' : 'bg-dark-700'
              }`}
            >
              <span className="text-xs font-medium text-gray-300">{toggle.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Effects Tab Component
function EffectsTab({
  selectedEffect,
  animationSpeed,
  particlesEnabled,
  onSelectEffect,
  onSetSpeed,
  onToggleParticles,
}: {
  selectedEffect: EffectPreset;
  animationSpeed: 'slow' | 'normal' | 'fast';
  particlesEnabled: boolean;
  onSelectEffect: (effect: EffectPreset) => void;
  onSetSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  onToggleParticles: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Visual Effects</h3>
      <p className="mb-6 text-sm text-gray-400">Add special effects to enhance your experience</p>

      {/* Effect Presets */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        {effectOptions.map((option) => {
          const isPremium = option.tier !== 'free';

          return (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isPremium && onSelectEffect(option.value)}
              disabled={isPremium}
              className={`rounded-xl p-4 text-left transition-all ${
                selectedEffect === option.value
                  ? 'bg-primary-600/20 ring-2 ring-primary-500'
                  : 'bg-dark-700 hover:bg-dark-600'
              } ${isPremium ? 'opacity-60' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-white">{option.label}</span>
                <TierBadge tier={option.tier} />
              </div>
              <p className="text-xs text-gray-400">{option.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Animation Speed */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-gray-400">Animation Speed</h4>
        <div className="flex gap-3">
          {(['slow', 'normal', 'fast'] as const).map((speed) => (
            <motion.button
              key={speed}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSetSpeed(speed)}
              className={`flex-1 rounded-xl px-4 py-2 text-center capitalize transition-all ${
                animationSpeed === speed
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              {speed}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Particles Toggle */}
      <div className="flex items-center justify-between rounded-xl bg-dark-700 p-4">
        <div>
          <span className="font-medium text-white">Particle Effects</span>
          <p className="text-xs text-gray-400">Show floating particles in animations</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleParticles}
          className={`h-6 w-12 rounded-full transition-colors ${
            particlesEnabled ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            animate={{ x: particlesEnabled ? 24 : 0 }}
            className="h-6 w-6 rounded-full bg-white shadow-lg"
          />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default ThemeCustomizer;
