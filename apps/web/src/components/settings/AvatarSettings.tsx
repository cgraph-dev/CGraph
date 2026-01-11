/**
 * Avatar & Profile Settings Component
 * Comprehensive avatar customization with animated borders and profile editing
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedAvatar, { useAvatarStyle } from '@/components/ui/AnimatedAvatar';
import { useAuthStore } from '@/stores/authStore';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  UserCircleIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

export default function AvatarSettings() {
  const { user } = useAuthStore();
  const { style, updateStyle, resetStyle, exportStyle, importStyle } = useAvatarStyle();
  const [importText, setImportText] = useState('');

  const borderStyles: Array<typeof style.borderStyle> = [
    'none',
    'solid',
    'gradient',
    'rainbow',
    'pulse',
    'spin',
    'glow',
    'neon',
    'fire',
    'electric',
  ];

  const shapes: Array<typeof style.shape> = ['circle', 'rounded-square', 'hexagon', 'star'];

  const animationSpeeds: Array<typeof style.animationSpeed> = ['none', 'slow', 'normal', 'fast'];

  const handleExport = () => {
    const json = exportStyle();
    navigator.clipboard.writeText(json);
    HapticFeedback.success();
    alert('Avatar style copied to clipboard!');
  };

  const handleImport = () => {
    if (importText.trim()) {
      importStyle(importText);
      setImportText('');
      HapticFeedback.success();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserCircleIcon className="h-8 w-8 text-primary-400" />
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent">
            Avatar & Profile
          </h2>
          <p className="text-sm text-gray-400 mt-1">Customize your avatar with animated borders and effects</p>
        </div>
      </div>

      {/* Preview Card */}
      <GlassCard className="p-8" variant="frosted">
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary-400" />
            Live Preview
          </h3>
          <AnimatedAvatar
            src={user?.avatar}
            alt={user?.displayName || 'User'}
            size="xl"
            status="online"
          />
          <p className="text-sm text-gray-400">Your avatar with current settings</p>
        </div>
      </GlassCard>

      {/* Border Style */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="text-lg font-semibold text-white mb-4">Border Style</h3>
        <div className="grid grid-cols-5 gap-3">
          {borderStyles.map((borderStyle) => (
            <motion.button
              key={borderStyle}
              onClick={() => {
                updateStyle('borderStyle', borderStyle);
                HapticFeedback.light();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative p-3 rounded-lg transition-all text-sm capitalize
                ${
                  style.borderStyle === borderStyle
                    ? 'bg-primary-500/20 border-2 border-primary-500 text-white'
                    : 'bg-dark-700/50 border border-dark-600 text-gray-400 hover:border-primary-500/50 hover:text-white'
                }
              `}
            >
              {borderStyle}
              {style.borderStyle === borderStyle && (
                <motion.div
                  layoutId="selectedBorderStyle"
                  className="absolute inset-0 rounded-lg bg-primary-500/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Border Width */}
      <GlassCard className="p-6" variant="frosted">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Border Width</h3>
          <span className="text-sm text-primary-400">{style.borderWidth}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={style.borderWidth}
          onChange={(e) => updateStyle('borderWidth', parseInt(e.target.value))}
          className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider-thumb-primary"
        />
      </GlassCard>

      {/* Border Color */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="text-lg font-semibold text-white mb-4">Border Color</h3>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={style.borderColor}
            onChange={(e) => updateStyle('borderColor', e.target.value)}
            className="h-12 w-24 rounded-lg cursor-pointer bg-transparent border border-dark-600"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-400">Selected Color</p>
            <p className="text-lg font-mono text-white">{style.borderColor}</p>
          </div>
        </div>
      </GlassCard>

      {/* Glow Intensity */}
      <GlassCard className="p-6" variant="frosted">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Glow Intensity</h3>
          <span className="text-sm text-primary-400">{style.glowIntensity}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={style.glowIntensity}
          onChange={(e) => updateStyle('glowIntensity', parseInt(e.target.value))}
          className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider-thumb-primary"
        />
      </GlassCard>

      {/* Animation Speed */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="text-lg font-semibold text-white mb-4">Animation Speed</h3>
        <div className="grid grid-cols-4 gap-3">
          {animationSpeeds.map((speed) => (
            <motion.button
              key={speed}
              onClick={() => {
                updateStyle('animationSpeed', speed);
                HapticFeedback.light();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative p-3 rounded-lg transition-all text-sm capitalize
                ${
                  style.animationSpeed === speed
                    ? 'bg-primary-500/20 border-2 border-primary-500 text-white'
                    : 'bg-dark-700/50 border border-dark-600 text-gray-400 hover:border-primary-500/50 hover:text-white'
                }
              `}
            >
              {speed}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Shape */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="text-lg font-semibold text-white mb-4">Avatar Shape</h3>
        <div className="grid grid-cols-4 gap-3">
          {shapes.map((shape) => (
            <motion.button
              key={shape}
              onClick={() => {
                updateStyle('shape', shape);
                HapticFeedback.light();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative p-3 rounded-lg transition-all text-sm capitalize
                ${
                  style.shape === shape
                    ? 'bg-primary-500/20 border-2 border-primary-500 text-white'
                    : 'bg-dark-700/50 border border-dark-600 text-gray-400 hover:border-primary-500/50 hover:text-white'
                }
              `}
            >
              {shape.replace('-', ' ')}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Export/Import */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="text-lg font-semibold text-white mb-4">Share Your Style</h3>
        <div className="space-y-4">
          <motion.button
            onClick={handleExport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500/20 border border-primary-500 text-white rounded-lg hover:bg-primary-500/30 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export Avatar Style
          </motion.button>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Import Style (Paste JSON)</label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"borderStyle":"rainbow","borderWidth":3,...}'
              className="w-full px-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none font-mono text-sm"
              rows={4}
            />
            <motion.button
              onClick={handleImport}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!importText.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-purple-500/20 border border-purple-500 text-white rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Import Avatar Style
            </motion.button>
          </div>

          <motion.button
            onClick={() => {
              resetStyle();
              HapticFeedback.medium();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 text-gray-400 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors"
          >
            Reset to Defaults
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
