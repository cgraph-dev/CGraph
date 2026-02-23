/**
 * Chat bubble appearance settings.
 * @module
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatBubbleStore, CHAT_BUBBLE_PRESETS, type ChatBubbleConfig } from '@/stores/theme';
import { useChatCustomization } from '@/modules/settings/store/customization';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import {
  ChatBubbleLeftIcon,
  SparklesIcon,
  SwatchIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import {
  CHAT_BACKGROUNDS,
  type BackgroundCategory,
  getBackgroundsByCategory,
} from '@/data/chatBackgrounds';
import {
  ColorsTab,
  ShapeTab,
  EffectsTab,
  AnimationsTab,
  LayoutTab,
  BackgroundsTab,
} from './chat-bubble-tabs';
import { CHAT_BUBBLE_PRESETS_UI } from './chat-bubble-settings.constants';

/**
 * Chat Bubble Customization Settings
 *
 * Comprehensive UI for customizing chat bubble appearance and behavior.
 * Includes animated backgrounds, advanced effects, and premium features.
 */

export default function ChatBubbleSettings() {
  const themeStore = useChatBubbleStore();
  const style = themeStore.chatBubble;
  const updateStyle = <K extends keyof ChatBubbleConfig>(key: K, value: ChatBubbleConfig[K]) =>
    themeStore.updateChatBubble({ [key]: value } as Partial<ChatBubbleConfig>); // type assertion: computed property key as config partial
  const resetStyle = themeStore.resetChatBubble;
  const applyPreset = themeStore.applyPreset;
  const { updateChat } = useChatCustomization();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTab, setActiveTab] = useState<
    'colors' | 'shape' | 'effects' | 'animations' | 'layout' | 'backgrounds'
  >('colors');
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

  const presets = CHAT_BUBBLE_PRESETS_UI;

  // Silently sync relevant fields to backend (debounced)
  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      const shadowMap = (value: number) => {
        if (value <= 0) return 'none';
        if (value <= 15) return 'light';
        if (value <= 35) return 'medium';
        return 'strong';
      };

      updateChat({
        bubbleStyle: style.bubbleShape,
        bubbleColor: style.ownMessageBg,
        bubbleOpacity: 100,
        bubbleRadius: style.borderRadius,
        bubbleShadow: shadowMap(style.shadowIntensity),
        textColor: style.ownMessageText,
        entranceAnimation: style.entranceAnimation,
        hoverEffect: style.hoverEffect ? 'lift' : 'none',
        glassEffect: style.glassEffect ? 'default' : 'none',
        borderStyle: style.borderStyle ?? 'none',
      });
    }, 500);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [style, updateChat]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
            <ChatBubbleLeftIcon className="h-7 w-7 text-primary-400" />
            Chat Bubble Customization
          </h2>
          <p className="mt-1 text-gray-400">Personalize your message bubbles</p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all chat bubble settings to defaults?')) {
              resetStyle();
              HapticFeedback.medium();
            }
          }}
          className="rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-red-400 transition-colors hover:bg-red-500/30"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Presets */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Quick Presets</h3>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {presets.map((preset) => (
            <motion.button
              key={preset.id}
              onClick={() => {
                applyPreset(preset.id as keyof typeof CHAT_BUBBLE_PRESETS);
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
        <h3 className="mb-4 text-lg font-bold text-white">Preview</h3>
        <div className="space-y-4 rounded-xl bg-dark-900/50 p-4">
          {/* Other person's message */}
          <div
            className={`flex items-end gap-2 ${style.alignReceived === 'right' ? 'flex-row-reverse' : ''}`}
          >
            {style.showAvatar && (
              <div
                className={`${
                  style.avatarSize === 'sm'
                    ? 'h-6 w-6'
                    : style.avatarSize === 'lg'
                      ? 'h-10 w-10'
                      : 'h-8 w-8'
                } flex-shrink-0 rounded-full bg-purple-600`}
              />
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
                border:
                  style.borderWidth > 0
                    ? `${style.borderWidth}px solid rgba(255,255,255,0.1)`
                    : undefined,
              }}
            >
              <p className="text-sm">Hey! How's it going?</p>
              {style.showTimestamp && style.timestampPosition === 'inside' && (
                <span className="mt-1 block text-xs opacity-70">12:34 PM</span>
              )}
            </div>
            {style.showTimestamp && style.timestampPosition === 'outside' && (
              <span className="text-xs text-gray-500">12:34 PM</span>
            )}
          </div>

          {/* Own message */}
          <div
            className={`flex items-end gap-2 ${style.alignSent === 'left' ? '' : 'flex-row-reverse'}`}
          >
            {style.showAvatar && (
              <div
                className={`${
                  style.avatarSize === 'sm'
                    ? 'h-6 w-6'
                    : style.avatarSize === 'lg'
                      ? 'h-10 w-10'
                      : 'h-8 w-8'
                } flex-shrink-0 rounded-full bg-primary-600`}
              />
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
                border:
                  style.borderWidth > 0
                    ? `${style.borderWidth}px solid rgba(255,255,255,0.1)`
                    : undefined,
              }}
            >
              <p className="text-sm">Pretty good! Just customizing my chat bubbles 🎨</p>
              {style.showTimestamp && style.timestampPosition === 'inside' && (
                <span className="mt-1 block text-xs opacity-70">12:35 PM</span>
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
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 font-medium transition-all ${
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
