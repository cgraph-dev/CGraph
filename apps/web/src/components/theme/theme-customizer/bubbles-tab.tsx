/**
 * Bubbles Tab Component
 *
 * Chat bubble style and settings customization.
 */

import { motion } from 'framer-motion';
 
import { THEME_COLORS, type ThemeColorPreset } from '@/stores/theme';
import { TierBadge } from '../premium-theme-gate';

import type { BubblesTabProps } from './types';
import { BUBBLE_STYLE_OPTIONS } from './constants';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the theme module.
 */
/**
 * Bubbles Tab component.
 */
export function BubblesTab({
  selectedStyle,
  selectedColor,
  bubbleSettings,
  onSelectStyle,
  onSelectColor,
  onUpdateSettings,
}: BubblesTabProps) {
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
        {BUBBLE_STYLE_OPTIONS.map((option) => {
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
          { }
          {(Object.keys(THEME_COLORS) as ThemeColorPreset[]).map((preset) => ( // type assertion: Object.keys returns string[], narrowing to known keys
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

export default BubblesTab;
