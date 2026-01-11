import { motion } from 'framer-motion';
import { useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Animated Avatar Component
 *
 * Provides customizable avatar borders with various animation styles.
 * Users can choose from multiple border styles, colors, and animations.
 */

export interface AvatarStyle {
  borderStyle: 'none' | 'solid' | 'gradient' | 'rainbow' | 'pulse' | 'spin' | 'glow' | 'neon' | 'fire' | 'electric';
  borderWidth: number; // 0-5
  borderColor: string;
  glowIntensity: number; // 0-100
  animationSpeed: 'none' | 'slow' | 'normal' | 'fast';
  shape: 'circle' | 'rounded-square' | 'hexagon' | 'star';
}

const defaultAvatarStyle: AvatarStyle = {
  borderStyle: 'gradient',
  borderWidth: 2,
  borderColor: '#10b981',
  glowIntensity: 50,
  animationSpeed: 'normal',
  shape: 'circle',
};

export const useAvatarStyle = create<{
  style: AvatarStyle;
  updateStyle: <K extends keyof AvatarStyle>(key: K, value: AvatarStyle[K]) => void;
  resetStyle: () => void;
}>()(
  persist(
    (set) => ({
      style: defaultAvatarStyle,
      updateStyle: (key, value) => {
        set((state) => ({
          style: { ...state.style, [key]: value },
        }));
      },
      resetStyle: () => set({ style: defaultAvatarStyle }),
    }),
    {
      name: 'cgraph-avatar-style',
    }
  )
);

interface AnimatedAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallbackText?: string;
  customStyle?: Partial<AvatarStyle>;
  className?: string;
  onClick?: () => void;
  showStatus?: boolean;
  statusType?: 'online' | 'idle' | 'dnd' | 'offline';
}

export default function AnimatedAvatar({
  src,
  alt,
  size = 'md',
  fallbackText,
  customStyle,
  className = '',
  onClick,
  showStatus = false,
  statusType = 'offline',
}: AnimatedAvatarProps) {
  const { style: globalStyle } = useAvatarStyle();
  const style = customStyle ? { ...globalStyle, ...customStyle } : globalStyle;

  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-24 w-24',
  };

  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  const animationDurations = {
    none: 0,
    slow: 4,
    normal: 2,
    fast: 1,
  };

  const getBorderStyle = () => {
    const width = style.borderWidth;

    switch (style.borderStyle) {
      case 'none':
        return {};

      case 'solid':
        return {
          border: `${width}px solid ${style.borderColor}`,
        };

      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${style.borderColor}, #8b5cf6, #ec4899)`,
          padding: `${width}px`,
        };

      case 'rainbow':
        return {
          background: 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
          padding: `${width}px`,
        };

      case 'pulse':
      case 'spin':
      case 'glow':
      case 'neon':
      case 'fire':
      case 'electric':
        return {
          background: `linear-gradient(135deg, ${style.borderColor}, #8b5cf6)`,
          padding: `${width}px`,
        };

      default:
        return {};
    }
  };

  const getAnimationProps = () => {
    const duration = animationDurations[style.animationSpeed];

    if (!duration) return {};

    switch (style.borderStyle) {
      case 'pulse':
        return {
          animate: {
            scale: [1, 1.05, 1],
            opacity: [1, 0.8, 1],
          },
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };

      case 'spin':
        return {
          animate: { rotate: 360 },
          transition: {
            duration,
            repeat: Infinity,
            ease: 'linear',
          },
        };

      case 'glow':
        return {
          animate: {
            boxShadow: [
              `0 0 ${style.glowIntensity * 0.2}px ${style.borderColor}`,
              `0 0 ${style.glowIntensity * 0.6}px ${style.borderColor}`,
              `0 0 ${style.glowIntensity * 0.2}px ${style.borderColor}`,
            ],
          },
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };

      case 'neon':
        return {
          animate: {
            boxShadow: [
              `0 0 ${style.glowIntensity * 0.3}px ${style.borderColor}, 0 0 ${style.glowIntensity * 0.5}px ${style.borderColor}`,
              `0 0 ${style.glowIntensity * 0.6}px ${style.borderColor}, 0 0 ${style.glowIntensity * 1}px ${style.borderColor}`,
              `0 0 ${style.glowIntensity * 0.3}px ${style.borderColor}, 0 0 ${style.glowIntensity * 0.5}px ${style.borderColor}`,
            ],
          },
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };

      case 'fire':
        return {
          animate: {
            boxShadow: [
              `0 0 ${style.glowIntensity * 0.4}px #ff4400, 0 0 ${style.glowIntensity * 0.8}px #ff6600`,
              `0 0 ${style.glowIntensity * 0.8}px #ff6600, 0 0 ${style.glowIntensity * 1.2}px #ff8800`,
              `0 0 ${style.glowIntensity * 0.4}px #ff4400, 0 0 ${style.glowIntensity * 0.8}px #ff6600`,
            ],
            filter: [
              'hue-rotate(0deg)',
              'hue-rotate(20deg)',
              'hue-rotate(0deg)',
            ],
          },
          transition: {
            duration: duration * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };

      case 'electric':
        return {
          animate: {
            boxShadow: [
              `0 0 ${style.glowIntensity * 0.3}px #00ffff, 0 0 ${style.glowIntensity * 0.6}px #0088ff`,
              `0 0 ${style.glowIntensity * 0.6}px #0088ff, 0 0 ${style.glowIntensity * 1}px #00ffff`,
              `0 0 ${style.glowIntensity * 0.3}px #00ffff, 0 0 ${style.glowIntensity * 0.6}px #0088ff`,
            ],
            scale: [1, 1.02, 1],
          },
          transition: {
            duration: duration * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };

      default:
        return {};
    }
  };

  const getShapeClass = () => {
    switch (style.shape) {
      case 'circle':
        return 'rounded-full';
      case 'rounded-square':
        return 'rounded-xl';
      case 'hexagon':
        return 'rounded-lg'; // Approximation
      case 'star':
        return 'rounded-lg'; // Approximation
      default:
        return 'rounded-full';
    }
  };

  const borderStyle = getBorderStyle();
  const animationProps = getAnimationProps();
  const shapeClass = getShapeClass();

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} ${shapeClass} overflow-hidden`}
        style={borderStyle}
        {...animationProps}
        onClick={onClick}
        whileHover={onClick ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      >
        <div className={`h-full w-full ${shapeClass} overflow-hidden bg-dark-800`}>
          {src ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600">
              <span className="text-white font-bold" style={{ fontSize: size === 'xs' ? '0.75rem' : size === 'sm' ? '1rem' : '1.5rem' }}>
                {fallbackText || alt.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Status Indicator */}
      {showStatus && (
        <motion.div
          className={`absolute bottom-0 right-0 ${
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'
          } rounded-full ${statusColors[statusType]} border-2 border-dark-900`}
          animate={{
            boxShadow: statusType === 'online' ? [
              '0 0 0 0 rgba(34, 197, 94, 0.7)',
              '0 0 0 4px rgba(34, 197, 94, 0)',
            ] : [],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}

// Avatar Style Picker Component
export function AvatarStylePicker() {
  const { style, updateStyle, resetStyle } = useAvatarStyle();

  const borderStyles = [
    { value: 'none', label: 'None' },
    { value: 'solid', label: 'Solid' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'rainbow', label: 'Rainbow' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'spin', label: 'Spin' },
    { value: 'glow', label: 'Glow' },
    { value: 'neon', label: 'Neon' },
    { value: 'fire', label: 'Fire' },
    { value: 'electric', label: 'Electric' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Avatar Customization</h3>
        <button
          onClick={resetStyle}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Reset to Default
        </button>
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center p-8 bg-dark-800/50 rounded-xl">
        <AnimatedAvatar
          alt="Preview"
          size="2xl"
          fallbackText="You"
          showStatus
          statusType="online"
        />
      </div>

      {/* Border Style */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">Border Style</label>
        <div className="grid grid-cols-5 gap-2">
          {borderStyles.map((bs) => (
            <button
              key={bs.value}
              onClick={() => updateStyle('borderStyle', bs.value as any)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                style.borderStyle === bs.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {bs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Border Width */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Border Width</label>
          <span className="text-sm text-primary-400">{style.borderWidth}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          value={style.borderWidth}
          onChange={(e) => updateStyle('borderWidth', Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Border Color */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">Border Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={style.borderColor}
            onChange={(e) => updateStyle('borderColor', e.target.value)}
            className="h-10 w-20 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={style.borderColor}
            onChange={(e) => updateStyle('borderColor', e.target.value)}
            className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm font-mono"
          />
        </div>
      </div>

      {/* Glow Intensity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Glow Intensity</label>
          <span className="text-sm text-primary-400">{style.glowIntensity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={style.glowIntensity}
          onChange={(e) => updateStyle('glowIntensity', Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Animation Speed */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">Animation Speed</label>
        <div className="grid grid-cols-4 gap-2">
          {['none', 'slow', 'normal', 'fast'].map((speed) => (
            <button
              key={speed}
              onClick={() => updateStyle('animationSpeed', speed as any)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                style.animationSpeed === speed
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Shape */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">Shape</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'circle', label: 'Circle' },
            { value: 'rounded-square', label: 'Rounded' },
            { value: 'hexagon', label: 'Hexagon' },
            { value: 'star', label: 'Star' },
          ].map((shape) => (
            <button
              key={shape.value}
              onClick={() => updateStyle('shape', shape.value as any)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                style.shape === shape.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
