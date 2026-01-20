/**
 * Chat Panel
 *
 * Customization panel for chat bubbles, colors, animations, and layout options.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ColorPickerGrid,
  GradientSlider,
  ToggleRow,
  SectionHeader,
  OptionButton,
} from '../CustomizationUI';
import {
  useCustomizationStoreV2,
  themeColors,
  type ChatBubbleStyle,
  type BubbleAnimation,
} from '@/stores/customizationStoreV2';

// =============================================================================
// BUBBLE STYLE OPTIONS
// =============================================================================

const bubbleStyles: { id: ChatBubbleStyle; name: string; icon: string }[] = [
  { id: 'default', name: 'Default', icon: '💬' },
  { id: 'rounded', name: 'Rounded', icon: '🔵' },
  { id: 'sharp', name: 'Sharp', icon: '🔷' },
  { id: 'cloud', name: 'Cloud', icon: '☁️' },
  { id: 'modern', name: 'Modern', icon: '📱' },
  { id: 'retro', name: 'Retro', icon: '👾' },
];

const bubbleAnimations: { id: BubbleAnimation; name: string; icon: string }[] = [
  { id: 'none', name: 'None', icon: '⏹️' },
  { id: 'slide', name: 'Slide', icon: '➡️' },
  { id: 'fade', name: 'Fade', icon: '🌫️' },
  { id: 'scale', name: 'Scale', icon: '🔍' },
  { id: 'bounce', name: 'Bounce', icon: '🏀' },
  { id: 'flip', name: 'Flip', icon: '🔄' },
];

// =============================================================================
// CHAT BUBBLE DEMO
// =============================================================================

interface ChatBubbleDemoProps {
  isOwn: boolean;
  message: string;
}

const ChatBubbleDemo = memo(function ChatBubbleDemo({ isOwn, message }: ChatBubbleDemoProps) {
  const {
    chatBubbleColor,
    bubbleBorderRadius,
    bubbleShadowIntensity,
    bubbleGlassEffect,
    bubbleShowTail,
    bubbleEntranceAnimation,
  } = useCustomizationStoreV2();

  const colors = themeColors[chatBubbleColor];

  const getAnimationVariants = () => {
    switch (bubbleEntranceAnimation) {
      case 'slide':
        return { initial: { x: isOwn ? 50 : -50, opacity: 0 }, animate: { x: 0, opacity: 1 } };
      case 'fade':
        return { initial: { opacity: 0 }, animate: { opacity: 1 } };
      case 'scale':
        return { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
      case 'bounce':
        return { initial: { y: 30, opacity: 0 }, animate: { y: 0, opacity: 1 } };
      case 'flip':
        return { initial: { rotateX: 90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 } };
      default:
        return { initial: { opacity: 1 }, animate: { opacity: 1 } };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      initial={variants.initial}
      animate={variants.animate}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div
        className={`relative max-w-[80%] px-4 py-2.5 ${isOwn ? 'text-white' : 'text-white/90'}`}
        style={{
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
        }}
      >
        <p className="text-sm">{message}</p>

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
// CHAT PANEL COMPONENT
// =============================================================================

export const ChatPanel = memo(function ChatPanel() {
  const {
    chatBubbleStyle,
    chatBubbleColor,
    bubbleBorderRadius,
    bubbleShadowIntensity,
    bubbleEntranceAnimation,
    bubbleGlassEffect,
    bubbleShowTail,
    bubbleHoverEffect,
    groupMessages,
    showTimestamps,
    compactMode,
    themePreset,
    setChatBubbleStyle,
    setChatBubbleColor,
    setBubbleBorderRadius,
    setBubbleShadowIntensity,
    setBubbleAnimation,
    toggleBubbleGlass,
    toggleBubbleTail,
    toggleBubbleHover,
    toggleGroupMessages,
    toggleTimestamps,
    toggleCompactMode,
  } = useCustomizationStoreV2();

  return (
    <div className="space-y-8">
      {/* Live Chat Preview */}
      <section>
        <SectionHeader
          title="Preview"
          subtitle="See how your chat bubbles look"
          icon={<span className="text-lg">💬</span>}
        />
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <AnimatePresence mode="wait">
            <div key={`${chatBubbleStyle}-${bubbleEntranceAnimation}`} className="space-y-3">
              <ChatBubbleDemo isOwn={false} message="Hey, check out my new profile!" />
              <ChatBubbleDemo isOwn={true} message="Wow, those effects look amazing! 🔥" />
              <ChatBubbleDemo isOwn={false} message="Thanks! Just customized everything" />
            </div>
          </AnimatePresence>
        </div>
      </section>

      {/* Bubble Style */}
      <section>
        <SectionHeader
          title="Bubble Style"
          subtitle="Choose your message bubble shape"
          icon={<span className="text-lg">🎨</span>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {bubbleStyles.map((style) => (
            <OptionButton
              key={style.id}
              selected={chatBubbleStyle === style.id}
              onClick={() => setChatBubbleStyle(style.id)}
              icon={<span className="text-xl">{style.icon}</span>}
              label={style.name}
              colorPreset={themePreset}
            />
          ))}
        </div>
      </section>

      {/* Bubble Color */}
      <section>
        <SectionHeader
          title="Bubble Color"
          subtitle="Set your outgoing message color"
          icon={<span className="text-lg">🌈</span>}
        />
        <ColorPickerGrid selected={chatBubbleColor} onSelect={setChatBubbleColor} size="lg" />
      </section>

      {/* Sliders */}
      <section>
        <SectionHeader
          title="Fine Tuning"
          subtitle="Adjust bubble appearance"
          icon={<span className="text-lg">🎚️</span>}
        />
        <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <GradientSlider
            label="Border Radius"
            value={bubbleBorderRadius}
            min={0}
            max={50}
            onChange={setBubbleBorderRadius}
            colorPreset={themePreset}
            suffix="px"
          />
          <GradientSlider
            label="Shadow Intensity"
            value={bubbleShadowIntensity}
            min={0}
            max={100}
            onChange={setBubbleShadowIntensity}
            colorPreset={themePreset}
            suffix="%"
          />
        </div>
      </section>

      {/* Entrance Animation */}
      <section>
        <SectionHeader
          title="Entrance Animation"
          subtitle="How messages appear on screen"
          icon={<span className="text-lg">✨</span>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {bubbleAnimations.map((anim) => (
            <OptionButton
              key={anim.id}
              selected={bubbleEntranceAnimation === anim.id}
              onClick={() => setBubbleAnimation(anim.id)}
              icon={<span className="text-xl">{anim.icon}</span>}
              label={anim.name}
              colorPreset={themePreset}
            />
          ))}
        </div>
      </section>

      {/* Visual Effects */}
      <section>
        <SectionHeader
          title="Visual Effects"
          subtitle="Toggle bubble visual features"
          icon={<span className="text-lg">💎</span>}
        />
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <ToggleRow
            label="Glass Effect"
            description="Frosted glass appearance"
            icon="🪟"
            enabled={bubbleGlassEffect}
            onToggle={toggleBubbleGlass}
            colorPreset={themePreset}
          />
          <div className="my-2 border-t border-white/5" />
          <ToggleRow
            label="Message Tail"
            description="Speech bubble pointer"
            icon="💬"
            enabled={bubbleShowTail}
            onToggle={toggleBubbleTail}
            colorPreset={themePreset}
          />
          <div className="my-2 border-t border-white/5" />
          <ToggleRow
            label="Hover Animation"
            description="Lift effect on hover"
            icon="✨"
            enabled={bubbleHoverEffect}
            onToggle={toggleBubbleHover}
            colorPreset={themePreset}
          />
        </div>
      </section>

      {/* Layout Options */}
      <section>
        <SectionHeader
          title="Layout Options"
          subtitle="Customize chat layout"
          icon={<span className="text-lg">📐</span>}
        />
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <ToggleRow
            label="Show Timestamps"
            description="Display message times"
            icon="🕐"
            enabled={showTimestamps}
            onToggle={toggleTimestamps}
            colorPreset={themePreset}
          />
          <div className="my-2 border-t border-white/5" />
          <ToggleRow
            label="Group Messages"
            description="Stack consecutive messages"
            icon="📦"
            enabled={groupMessages}
            onToggle={toggleGroupMessages}
            colorPreset={themePreset}
          />
          <div className="my-2 border-t border-white/5" />
          <ToggleRow
            label="Compact Mode"
            description="Reduce spacing between messages"
            icon="📐"
            enabled={compactMode}
            onToggle={toggleCompactMode}
            colorPreset={themePreset}
          />
        </div>
      </section>
    </div>
  );
});

export default ChatPanel;
