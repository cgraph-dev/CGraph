/**
 * ChatControlPanel Component
 *
 * Control panel for chat bubble customization settings.
 *
 * @module components/landing/CustomizationDemo/ChatControlPanel
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DemoState, ChatBubbleStyle, ThemePreset } from './types';
import { themeColors } from './constants';
import { springs } from '../animations';

interface ChatControlPanelProps {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}

export const ChatControlPanel = memo(function ChatControlPanel({
  state,
  onChange,
}: ChatControlPanelProps) {
  const colors = themeColors[state.theme];

  return (
    <div className="space-y-5">
      {/* Bubble Style */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Bubble Style</label>
        <div className="grid grid-cols-3 gap-2">
          {(['default', 'rounded', 'sharp', 'cloud', 'modern', 'retro'] as ChatBubbleStyle[]).map(
            (style) => (
              <motion.button
                key={style}
                className={`rounded-lg border px-3 py-2 text-xs capitalize transition-all ${
                  state.chatBubbleStyle === style
                    ? 'border-white/50 bg-white/10 text-white'
                    : 'border-white/10 text-gray-400 hover:border-white/30'
                }`}
                onClick={() => onChange({ chatBubbleStyle: style })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {style}
              </motion.button>
            )
          )}
        </div>
      </div>

      {/* Bubble Color */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Bubble Color</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(themeColors) as ThemePreset[]).map((color) => (
            <motion.button
              key={color}
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                state.chatBubbleColor === color ? 'scale-110 border-white' : 'border-transparent'
              }`}
              style={{
                background: `linear-gradient(135deg, ${themeColors[color].primary}, ${themeColors[color].secondary})`,
              }}
              onClick={() => onChange({ chatBubbleColor: color })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Select ${themeColors[color].name} bubble color`}
            />
          ))}
        </div>
      </div>

      {/* Sections for Border Radius and Shadow Intensity removed to streamline UX */}

      {/* Entrance Animation */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Entrance Animation</label>
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'slide', 'fade', 'scale', 'bounce', 'flip'] as const).map((anim) => (
            <motion.button
              key={anim}
              className={`rounded-lg border px-2 py-1.5 text-xs capitalize transition-all ${
                state.bubbleEntranceAnimation === anim
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ bubbleEntranceAnimation: anim })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {anim}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat Visual Effects */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Visual Effects</label>
        {[
          {
            key: 'bubbleGlassEffect',
            label: 'Glass Effect',
            icon: '💎',
            desc: 'Frosted glass backdrop blur',
          },
          {
            key: 'bubbleShowTail',
            label: 'Message Tail',
            icon: '💬',
            desc: 'Classic chat bubble tail',
          },
          { key: 'bubbleHoverEffect', label: 'Hover Animation', icon: '✨', desc: 'Lift on hover' },
        ].map(({ key, label, icon, desc }) => (
          <label
            key={key}
            className="flex cursor-pointer items-start justify-between rounded-lg border border-white/10 p-2.5 transition-colors hover:border-white/20"
          >
            <div className="flex-1">
              <span className="flex items-center gap-2 text-sm text-gray-300">
                <span>{icon}</span> {label}
              </span>
              <p className="mt-0.5 text-[10px] text-gray-500">{desc}</p>
            </div>
            <motion.div
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                state[key as keyof DemoState] ? '' : 'bg-gray-700'
              }`}
              style={{
                background: state[key as keyof DemoState]
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  : undefined,
              }}
              onClick={() => onChange({ [key]: !state[key as keyof DemoState] })}
            >
              <motion.div
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ left: state[key as keyof DemoState] ? '18px' : '2px' }}
                transition={springs.snappy}
              />
            </motion.div>
          </label>
        ))}
      </div>

      {/* Chat Layout Options */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Layout Options</label>
        {[
          {
            key: 'showTimestamps',
            label: 'Show Timestamps',
            icon: '🕐',
            desc: 'Display message time',
          },
          { key: 'compactMode', label: 'Compact Mode', icon: '📐', desc: 'Reduced spacing' },
          {
            key: 'groupMessages',
            label: 'Group Messages',
            icon: '📦',
            desc: 'Combine sequential messages',
          },
        ].map(({ key, label, icon, desc }) => (
          <label
            key={key}
            className="flex cursor-pointer items-start justify-between rounded-lg border border-white/10 p-2.5 transition-colors hover:border-white/20"
          >
            <div className="flex-1">
              <span className="flex items-center gap-2 text-sm text-gray-300">
                <span>{icon}</span> {label}
              </span>
              <p className="mt-0.5 text-[10px] text-gray-500">{desc}</p>
            </div>
            <motion.div
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                state[key as keyof DemoState] ? '' : 'bg-gray-700'
              }`}
              style={{
                background: state[key as keyof DemoState]
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  : undefined,
              }}
              onClick={() => onChange({ [key]: !state[key as keyof DemoState] })}
            >
              <motion.div
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ left: state[key as keyof DemoState] ? '18px' : '2px' }}
                transition={springs.snappy}
              />
            </motion.div>
          </label>
        ))}
      </div>

      {/* Advanced Features Hint */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
          <span>💡</span> Pro Tip
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Access 20+ more customization options in the full web app including gradient controls,
          border styles, and typing indicators
        </p>
      </div>
    </div>
  );
});
