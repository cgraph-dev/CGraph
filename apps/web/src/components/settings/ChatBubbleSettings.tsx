import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatBubbleStore } from '@/stores/chatBubbleStore';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  ChatBubbleLeftIcon,
  SparklesIcon,
  SwatchIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  PhotoIcon,
  LockClosedIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  CHAT_BACKGROUNDS,
  type ChatBackground,
  type BackgroundCategory,
  getBackgroundsByCategory,
} from '@/data/chatBackgrounds';

/**
 * Chat Bubble Customization Settings
 *
 * Comprehensive UI for customizing chat bubble appearance and behavior.
 * Includes animated backgrounds, advanced effects, and premium features.
 */

// Category colors for backgrounds
const CATEGORY_COLORS: Record<BackgroundCategory, { bg: string; text: string; border: string }> = {
  free: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  premium: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  legendary: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  seasonal: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
};

export default function ChatBubbleSettings() {
  const { style, updateStyle, resetStyle, applyPreset } =
    useChatBubbleStore();
  const [activeTab, setActiveTab] = useState<'colors' | 'shape' | 'effects' | 'animations' | 'layout' | 'backgrounds'>('colors');
  const [selectedBackground, setSelectedBackground] = useState<string>('default_dark');
  const [backgroundCategory, setBackgroundCategory] = useState<BackgroundCategory | 'all'>('all');

  const tabs = [
    { id: 'colors' as const, label: 'Colors', icon: SwatchIcon },
    { id: 'shape' as const, label: 'Shape', icon: ChatBubbleLeftIcon },
    { id: 'effects' as const, label: 'Effects', icon: SparklesIcon },
    { id: 'animations' as const, label: 'Animations', icon: Cog6ToothIcon },
    { id: 'layout' as const, label: 'Layout', icon: Cog6ToothIcon },
    { id: 'backgrounds' as const, label: 'Backgrounds', icon: PhotoIcon },
  ];

  // Filter backgrounds by category
  const filteredBackgrounds = useMemo(() => {
    if (backgroundCategory === 'all') return CHAT_BACKGROUNDS;
    return getBackgroundsByCategory(backgroundCategory);
  }, [backgroundCategory]);

  const presets = [
    { id: 'default', label: 'Default', preview: 'bg-gradient-to-r from-primary-600 to-purple-600' },
    { id: 'minimal', label: 'Minimal', preview: 'bg-dark-900 border border-dark-600' },
    { id: 'modern', label: 'Modern', preview: 'bg-gradient-to-br from-purple-600 to-pink-600' },
    { id: 'retro', label: 'Retro', preview: 'bg-primary-600 border-2 border-primary-400' },
    { id: 'bubble', label: 'Bubble', preview: 'bg-blue-500' },
    { id: 'glass', label: 'Glass', preview: 'bg-primary-500/30 backdrop-blur-md border border-primary-400/50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ChatBubbleLeftIcon className="h-7 w-7 text-primary-400" />
            Chat Bubble Customization
          </h2>
          <p className="text-gray-400 mt-1">Personalize your message bubbles</p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all chat bubble settings to defaults?')) {
              resetStyle();
              HapticFeedback.medium();
            }
          }}
          className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Presets */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick Presets</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {presets.map((preset) => (
            <motion.button
              key={preset.id}
              onClick={() => {
                applyPreset(preset.id as any);
                HapticFeedback.light();
              }}
              className="flex flex-col items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`h-16 w-full rounded-xl ${preset.preview}`} />
              <span className="text-xs text-gray-300">{preset.label}</span>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Preview */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Preview</h3>
        <div className="space-y-4 p-4 bg-dark-900/50 rounded-xl">
          {/* Other person's message */}
          <div className={`flex items-end gap-2 ${style.alignReceived === 'right' ? 'flex-row-reverse' : ''}`}>
            {style.showAvatar && (
              <div className={`${
                style.avatarSize === 'small' ? 'h-6 w-6' : style.avatarSize === 'large' ? 'h-10 w-10' : 'h-8 w-8'
              } rounded-full bg-purple-600 flex-shrink-0`} />
            )}
            <div
              className={`px-4 py-2 max-w-[${style.maxWidth}%]`}
              style={{
                backgroundColor: style.useGradient ? undefined : style.otherMessageBg,
                background: style.useGradient
                  ? `linear-gradient(${style.gradientDirection}, ${style.otherMessageBg}, #8b5cf6)`
                  : undefined,
                borderRadius: `${style.borderRadius}px`,
                color: style.otherMessageText,
                backdropFilter: style.glassEffect ? `blur(${style.glassBlur}px)` : undefined,
                boxShadow: `0 ${style.shadowIntensity / 10}px ${style.shadowIntensity / 5}px rgba(0,0,0,${style.shadowIntensity / 100})`,
                border: style.borderWidth > 0 ? `${style.borderWidth}px solid rgba(255,255,255,0.1)` : undefined,
              }}
            >
              <p className="text-sm">Hey! How's it going?</p>
              {style.showTimestamp && style.timestampPosition === 'inside' && (
                <span className="text-xs opacity-70 mt-1 block">12:34 PM</span>
              )}
            </div>
            {style.showTimestamp && style.timestampPosition === 'outside' && (
              <span className="text-xs text-gray-500">12:34 PM</span>
            )}
          </div>

          {/* Own message */}
          <div className={`flex items-end gap-2 ${style.alignSent === 'left' ? '' : 'flex-row-reverse'}`}>
            {style.showAvatar && (
              <div className={`${
                style.avatarSize === 'small' ? 'h-6 w-6' : style.avatarSize === 'large' ? 'h-10 w-10' : 'h-8 w-8'
              } rounded-full bg-primary-600 flex-shrink-0`} />
            )}
            <div
              className={`px-4 py-2 max-w-[${style.maxWidth}%]`}
              style={{
                backgroundColor: style.useGradient ? undefined : style.ownMessageBg,
                background: style.useGradient
                  ? `linear-gradient(${style.gradientDirection}, ${style.ownMessageBg}, #8b5cf6)`
                  : undefined,
                borderRadius: `${style.borderRadius}px`,
                color: style.ownMessageText,
                backdropFilter: style.glassEffect ? `blur(${style.glassBlur}px)` : undefined,
                boxShadow: `0 ${style.shadowIntensity / 10}px ${style.shadowIntensity / 5}px rgba(0,0,0,${style.shadowIntensity / 100})`,
                border: style.borderWidth > 0 ? `${style.borderWidth}px solid rgba(255,255,255,0.1)` : undefined,
              }}
            >
              <p className="text-sm">Pretty good! Just customizing my chat bubbles 🎨</p>
              {style.showTimestamp && style.timestampPosition === 'inside' && (
                <span className="text-xs opacity-70 mt-1 block">12:35 PM</span>
              )}
            </div>
            {style.showTimestamp && style.timestampPosition === 'outside' && (
              <span className="text-xs text-gray-500">12:35 PM</span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                HapticFeedback.light();
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'colors' && <ColorsTab style={style} updateStyle={updateStyle} />}
          {activeTab === 'shape' && <ShapeTab style={style} updateStyle={updateStyle} />}
          {activeTab === 'effects' && <EffectsTab style={style} updateStyle={updateStyle} />}
          {activeTab === 'animations' && <AnimationsTab style={style} updateStyle={updateStyle} />}
          {activeTab === 'layout' && <LayoutTab style={style} updateStyle={updateStyle} />}
          {activeTab === 'backgrounds' && (
            <BackgroundsTab
              backgrounds={filteredBackgrounds}
              selectedBackground={selectedBackground}
              setSelectedBackground={setSelectedBackground}
              backgroundCategory={backgroundCategory}
              setBackgroundCategory={setBackgroundCategory}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Helper components for each tab
function ColorsTab({ style, updateStyle }: any) {
  return (
    <GlassCard variant="frosted" className="p-6 space-y-6">
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">Your Messages</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={style.ownMessageBg}
            onChange={(e) => updateStyle('ownMessageBg', e.target.value)}
            className="h-10 w-20 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={style.ownMessageBg}
            onChange={(e) => updateStyle('ownMessageBg', e.target.value)}
            className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm font-mono"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">Other Messages</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={style.otherMessageBg}
            onChange={(e) => updateStyle('otherMessageBg', e.target.value)}
            className="h-10 w-20 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={style.otherMessageBg}
            onChange={(e) => updateStyle('otherMessageBg', e.target.value)}
            className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Use Gradient</label>
        <button
          onClick={() => updateStyle('useGradient', !style.useGradient)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            style.useGradient ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
            animate={{ x: style.useGradient ? 24 : 0 }}
          />
        </button>
      </div>

      {style.useGradient && (
        <div>
          <label className="text-sm font-medium text-gray-300 mb-3 block">Gradient Direction</label>
          <div className="grid grid-cols-3 gap-2">
            {['to-r', 'to-l', 'to-br', 'to-bl', 'to-tr', 'to-tl'].map((dir) => (
              <button
                key={dir}
                onClick={() => updateStyle('gradientDirection', dir)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  style.gradientDirection === dir
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function ShapeTab({ style, updateStyle }: any) {
  return (
    <GlassCard variant="frosted" className="p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Border Radius</label>
          <span className="text-sm text-primary-400">{style.borderRadius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={style.borderRadius}
          onChange={(e) => updateStyle('borderRadius', Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">Bubble Shape</label>
        <div className="grid grid-cols-2 gap-2">
          {['rounded', 'sharp', 'super-rounded', 'bubble', 'modern'].map((shape) => (
            <button
              key={shape}
              onClick={() => updateStyle('bubbleShape', shape)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                style.bubbleShape === shape
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {shape}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Show Tail</label>
        <button
          onClick={() => updateStyle('showTail', !style.showTail)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            style.showTail ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
            animate={{ x: style.showTail ? 24 : 0 }}
          />
        </button>
      </div>
    </GlassCard>
  );
}

function EffectsTab({ style, updateStyle }: any) {
  return (
    <GlassCard variant="frosted" className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Glass Effect</label>
        <button
          onClick={() => updateStyle('glassEffect', !style.glassEffect)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            style.glassEffect ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
            animate={{ x: style.glassEffect ? 24 : 0 }}
          />
        </button>
      </div>

      {style.glassEffect && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">Glass Blur</label>
            <span className="text-sm text-primary-400">{style.glassBlur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={style.glassBlur}
            onChange={(e) => updateStyle('glassBlur', Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Shadow Intensity</label>
          <span className="text-sm text-primary-400">{style.shadowIntensity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={style.shadowIntensity}
          onChange={(e) => updateStyle('shadowIntensity', Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Border Width</label>
          <span className="text-sm text-primary-400">{style.borderWidth}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="3"
          value={style.borderWidth}
          onChange={(e) => updateStyle('borderWidth', Number(e.target.value))}
          className="w-full"
        />
      </div>
    </GlassCard>
  );
}

function AnimationsTab({ style, updateStyle }: any) {
  return (
    <GlassCard variant="frosted" className="p-6 space-y-6">
      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">Entrance Animation</label>
        <div className="grid grid-cols-3 gap-2">
          {['none', 'slide', 'fade', 'scale', 'bounce', 'flip'].map((anim) => (
            <button
              key={anim}
              onClick={() => updateStyle('entranceAnimation', anim)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                style.entranceAnimation === anim
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {anim}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Hover Effect</label>
        <button
          onClick={() => updateStyle('hoverEffect', !style.hoverEffect)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            style.hoverEffect ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
            animate={{ x: style.hoverEffect ? 24 : 0 }}
          />
        </button>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">Typing Indicator</label>
        <div className="grid grid-cols-2 gap-2">
          {['dots', 'wave', 'pulse', 'bars'].map((type) => (
            <button
              key={type}
              onClick={() => updateStyle('typingIndicatorStyle', type)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                style.typingIndicatorStyle === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function LayoutTab({ style, updateStyle }: any) {
  return (
    <GlassCard variant="frosted" className="p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Max Width</label>
          <span className="text-sm text-primary-400">{style.maxWidth}%</span>
        </div>
        <input
          type="range"
          min="40"
          max="90"
          value={style.maxWidth}
          onChange={(e) => updateStyle('maxWidth', Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Show Avatar</label>
        <button
          onClick={() => updateStyle('showAvatar', !style.showAvatar)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            style.showAvatar ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
            animate={{ x: style.showAvatar ? 24 : 0 }}
          />
        </button>
      </div>

      {style.showAvatar && (
        <div>
          <label className="text-sm font-medium text-gray-300 mb-3 block">Avatar Size</label>
          <div className="grid grid-cols-3 gap-2">
            {['small', 'medium', 'large'].map((size) => (
              <button
                key={size}
                onClick={() => updateStyle('avatarSize', size)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                  style.avatarSize === size
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Show Timestamp</label>
        <button
          onClick={() => updateStyle('showTimestamp', !style.showTimestamp)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            style.showTimestamp ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
            animate={{ x: style.showTimestamp ? 24 : 0 }}
          />
        </button>
      </div>

      {style.showTimestamp && (
        <div>
          <label className="text-sm font-medium text-gray-300 mb-3 block">Timestamp Position</label>
          <div className="grid grid-cols-2 gap-2">
            {['inside', 'outside'].map((pos) => (
              <button
                key={pos}
                onClick={() => updateStyle('timestampPosition', pos)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                  style.timestampPosition === pos
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

interface BackgroundsTabProps {
  backgrounds: ChatBackground[];
  selectedBackground: string;
  setSelectedBackground: (id: string) => void;
  backgroundCategory: BackgroundCategory | 'all';
  setBackgroundCategory: (cat: BackgroundCategory | 'all') => void;
}

function BackgroundsTab({
  backgrounds,
  selectedBackground,
  setSelectedBackground,
  backgroundCategory,
  setBackgroundCategory,
}: BackgroundsTabProps) {
  // Mock owned backgrounds - in production this would come from user data
  const ownedBackgrounds = ['default_dark', 'subtle_gradient', 'ocean_depth', 'forest_night'];

  const categories: { id: BackgroundCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'free', label: 'Free' },
    { id: 'premium', label: 'Premium' },
    { id: 'legendary', label: 'Legendary' },
    { id: 'seasonal', label: 'Seasonal' },
  ];

  const getBackgroundPreviewStyle = (bg: ChatBackground): React.CSSProperties => {
    if (bg.type === 'solid') {
      return { backgroundColor: bg.colors[0] };
    }
    if (bg.type === 'gradient' || bg.type === 'animated') {
      return {
        background: `linear-gradient(135deg, ${bg.colors.join(', ')})`,
      };
    }
    if (bg.type === 'particle') {
      return {
        background: `radial-gradient(circle at 50% 50%, ${bg.colors[0]}40 0%, ${bg.colors[1] || bg.colors[0]}20 100%)`,
        backgroundColor: '#0f0f17',
      };
    }
    return { backgroundColor: bg.colors[0] };
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <GlassCard variant="frosted" className="p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const colors = cat.id !== 'all' ? CATEGORY_COLORS[cat.id] : null;
            return (
              <motion.button
                key={cat.id}
                onClick={() => {
                  setBackgroundCategory(cat.id);
                  HapticFeedback.light();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  backgroundCategory === cat.id
                    ? colors
                      ? `${colors.bg} ${colors.text} border ${colors.border}`
                      : 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      {/* Selected Background Preview */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Current Background Preview</h3>
        <div className="relative rounded-xl overflow-hidden h-48">
          {/* Background */}
          {backgrounds.find(bg => bg.id === selectedBackground) && (
            <motion.div
              className="absolute inset-0"
              style={getBackgroundPreviewStyle(backgrounds.find(bg => bg.id === selectedBackground)!)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated effect overlay */}
              {backgrounds.find(bg => bg.id === selectedBackground)?.animation && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: (backgrounds.find(bg => bg.id === selectedBackground)?.animation?.speed || 5),
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}
            </motion.div>
          )}

          {/* Sample messages */}
          <div className="relative z-10 p-4 space-y-3">
            <div className="flex justify-start">
              <div className="bg-dark-800/80 backdrop-blur-sm px-4 py-2 rounded-2xl rounded-bl-md max-w-[70%]">
                <p className="text-sm text-white">Hey! How's it going?</p>
                <span className="text-xs text-gray-400">12:34 PM</span>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-primary-600/80 backdrop-blur-sm px-4 py-2 rounded-2xl rounded-br-md max-w-[70%]">
                <p className="text-sm text-white">Great! Just customizing my chat!</p>
                <span className="text-xs text-white/70">12:35 PM</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Background Grid */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Available Backgrounds
          <span className="text-sm text-gray-400 font-normal ml-2">
            ({backgrounds.length} backgrounds)
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {backgrounds.map((bg) => {
            const isOwned = ownedBackgrounds.includes(bg.id);
            const isSelected = selectedBackground === bg.id;
            const categoryColors = CATEGORY_COLORS[bg.category];

            return (
              <motion.button
                key={bg.id}
                onClick={() => {
                  if (isOwned) {
                    setSelectedBackground(bg.id);
                    HapticFeedback.medium();
                  } else {
                    HapticFeedback.heavy();
                  }
                }}
                className={`relative rounded-xl overflow-hidden transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-dark-900'
                    : 'hover:ring-1 hover:ring-white/20'
                } ${!isOwned ? 'opacity-70' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Background Preview */}
                <div
                  className="h-24 w-full"
                  style={getBackgroundPreviewStyle(bg)}
                >
                  {/* Animation indicator */}
                  {bg.animation && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{
                        duration: bg.animation.speed / 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  )}

                  {/* Lock overlay for unowned */}
                  {!isOwned && (
                    <div className="absolute inset-0 bg-dark-900/60 flex items-center justify-center">
                      <div className="text-center">
                        <LockClosedIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                        <span className="text-xs text-gray-400">{bg.coinPrice} coins</span>
                      </div>
                    </div>
                  )}

                  {/* Selected check */}
                  {isSelected && isOwned && (
                    <motion.div
                      className="absolute top-2 right-2 bg-primary-500 rounded-full p-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <CheckIcon className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 bg-dark-800">
                  <p className="text-sm font-medium text-white truncate">{bg.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border} border capitalize`}>
                      {bg.category}
                    </span>
                    {bg.animation && (
                      <span className="text-xs text-gray-400">
                        {bg.animation.type}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      {/* Animation Settings for Selected Background */}
      {backgrounds.find(bg => bg.id === selectedBackground)?.animation && (
        <GlassCard variant="frosted" className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Animation Settings</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Animation Speed</label>
                <span className="text-sm text-primary-400">
                  {backgrounds.find(bg => bg.id === selectedBackground)?.animation?.speed}s
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                defaultValue={backgrounds.find(bg => bg.id === selectedBackground)?.animation?.speed || 5}
                className="w-full accent-primary-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Animation Intensity</label>
                <span className="text-sm text-primary-400">
                  {backgrounds.find(bg => bg.id === selectedBackground)?.animation?.intensity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={backgrounds.find(bg => bg.id === selectedBackground)?.animation?.intensity || 50}
                className="w-full accent-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Reduce Motion</label>
              <button
                className="relative w-12 h-6 rounded-full transition-colors bg-dark-600 hover:bg-dark-500"
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
                />
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Info Box */}
      <GlassCard variant="crystal" glow className="p-4">
        <div className="flex items-start gap-3">
          <SparklesIcon className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300">
              <strong className="text-white">Premium backgrounds</strong> include animated effects like waves, particles, and flowing gradients.
              Unlock them with coins from the shop or by upgrading to Premium+.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
