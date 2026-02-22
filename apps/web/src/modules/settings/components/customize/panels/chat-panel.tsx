/**
 * Chat Panel
 *
 * Customization panel for chat bubbles, colors, animations, and layout options.
 */

import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ColorPickerGrid,
  GradientSlider,
  ToggleRow,
  SectionHeader,
  OptionButton,
} from '../customization-ui';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import { bubbleStyles, bubbleAnimations } from './chat-panel.constants';
import { ChatBubbleDemo } from './chat-bubble-demo';

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
  } = useCustomizationStore();

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
