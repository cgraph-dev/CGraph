/**
 * Chat Effects Section
 *
 * Manages chat message effects, bubble styles, and typing indicators.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { useChatEffectsStore } from '@/modules/chat/store';

import type { ChatEffectSubTab } from './types';
import { TypingPreview } from './typing-preview';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the settings module.
 */
/**
 * Chat Effects Section section component.
 */
export function ChatEffectsSection() {
  const {
    messageEffects,
    bubbleStyles,
    typingIndicators,
    activeMessageEffect,
    activeBubbleStyle,
    activeTypingIndicator,
    activateEffect,
    activateBubbleStyle,
    activateTypingIndicator,
  } = useChatEffectsStore();

  const [activeSubTab, setActiveSubTab] = useState<ChatEffectSubTab>('message');

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(['message', 'bubble', 'typing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              activeSubTab === tab
                ? 'border border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                : 'border border-transparent bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'message' && '💬 Message Effects'}
            {tab === 'bubble' && '🫧 Bubble Styles'}
            {tab === 'typing' && '⌨️ Typing Indicators'}
          </button>
        ))}
      </div>

      {/* Message Effects */}
      {activeSubTab === 'message' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {messageEffects.map((effect) => {
            const isActive = activeMessageEffect?.effect === effect.id;

            return (
              <motion.div
                key={effect.id}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => activateEffect(effect.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="mb-2 text-2xl">{effect.icon || '✨'}</div>
                <h4 className="font-medium">{effect.name}</h4>
                <p className="mt-1 text-xs text-gray-500">{effect.description}</p>

                {isActive && <div className="mt-2 text-xs text-cyan-400">Active</div>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bubble Styles */}
      {activeSubTab === 'bubble' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {bubbleStyles.map((style) => {
            const isActive = activeBubbleStyle?.style === style.id;

            return (
              <motion.div
                key={style.id}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => activateBubbleStyle(style.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Preview Bubble */}
                <div
                  className="mb-3 p-3 text-sm"
                  style={{
                    borderRadius: style.borderRadius || 18,
                    background: style.gradient || 'rgba(255,255,255,0.1)',
                    boxShadow: style.glowColor ? `0 0 20px ${style.glowColor}` : undefined,
                  }}
                >
                  Preview message
                </div>

                <h4 className="font-medium">{style.name}</h4>

                {isActive && <div className="mt-2 text-xs text-cyan-400">Active</div>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Typing Indicators */}
      {activeSubTab === 'typing' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {typingIndicators.map((indicator) => {
            const isActive = activeTypingIndicator?.style === indicator.id;

            return (
              <motion.div
                key={indicator.id}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => activateTypingIndicator(indicator.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Preview Animation */}
                <div className="mb-3 flex h-8 items-center justify-center">
                  <TypingPreview type={indicator.id} />
                </div>

                <h4 className="font-medium">{indicator.name}</h4>

                {isActive && <div className="mt-2 text-xs text-cyan-400">Active</div>}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ChatEffectsSection;
