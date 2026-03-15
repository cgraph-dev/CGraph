 
/**
 * NameStylesSection Component
 *
 * Displays font, effect, and color pickers for display name customization.
 * Mirrors the mobile NameStylePicker but adapted for the web grid layout.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  NAME_FONTS,
  NAME_FONT_KEYS,
  NAME_EFFECTS,
  NAME_EFFECT_KEYS,
  NAME_COLORS,
  type NameFont,
  type NameEffect,
} from '@cgraph/animation-constants';
import { GlassCard } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';

export interface NameStylesSectionProps {
  selectedFont: string;
  selectedEffect: string;
  selectedColor: string;
  selectedSecondaryColor: string | null;
  onFontChange: (font: string) => void;
  onEffectChange: (effect: string) => void;
  onColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string | null) => void;
}

/**
 * Display name style preview with the currently selected settings.
 */
function NamePreview({
  font,
  effect,
  color,
  secondaryColor,
}: {
  font: NameFont;
  effect: NameEffect;
  color: string;
  secondaryColor: string | null;
}) {
  const fontConfig = NAME_FONTS[font] || NAME_FONTS.default;

  const baseStyle: React.CSSProperties = {
    fontSize: '1.75rem',
    fontWeight: fontConfig.fontWeight || '600',
    fontFamily: fontConfig.fontFamily || 'inherit',
    fontStyle: fontConfig.fontStyle || 'normal',
    letterSpacing: fontConfig.letterSpacing ?? 0,
  };

  const secondary = secondaryColor || '#8b5cf6';

  switch (effect) {
    case 'gradient':
      return (
        <span
          style={{
            ...baseStyle,
            background: `linear-gradient(135deg, ${color}, ${secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          CryptoNinja
        </span>
      );
    case 'neon':
      return (
        <span
          style={{
            ...baseStyle,
            color,
            textShadow: `0 0 7px ${color}, 0 0 10px ${color}, 0 0 21px ${color}, 0 0 42px ${secondary}`,
          }}
        >
          CryptoNinja
        </span>
      );
    case 'toon':
      return (
        <span
          style={{
            ...baseStyle,
            color,
            WebkitTextStroke: '1px rgba(0,0,0,0.6)',
            textShadow: `2px 2px 0 rgba(0,0,0,0.3)`,
          }}
        >
          CryptoNinja
        </span>
      );
    case 'pop':
      return (
        <span
          style={{
            ...baseStyle,
            color,
            textShadow: `3px 3px 0 ${secondary}, -1px -1px 0 rgba(0,0,0,0.2)`,
          }}
        >
          CryptoNinja
        </span>
      );
    default:
      return <span style={{ ...baseStyle, color }}>CryptoNinja</span>;
  }
}

/**
 * Name styles section for display name customization.
 */
export function NameStylesSection({
  selectedFont,
  selectedEffect,
  selectedColor,
  selectedSecondaryColor,
  onFontChange,
  onEffectChange,
  onColorChange,
  onSecondaryColorChange,
}: NameStylesSectionProps) {
  const [customColor, setCustomColor] = useState(selectedColor);
  const needsSecondary =
    selectedEffect === 'gradient' || selectedEffect === 'neon' || selectedEffect === 'pop';

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <GlassCard variant="frosted" className="flex items-center justify-center p-8">
        <NamePreview
          font={selectedFont as NameFont}
          effect={selectedEffect as NameEffect}
          color={selectedColor}
          secondaryColor={selectedSecondaryColor}
        />
      </GlassCard>

      {/* Fonts */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white/80">Font Style</h3>
        <div className="grid grid-cols-4 gap-2">
          {NAME_FONT_KEYS.map((fontKey) => {
            const config = NAME_FONTS[fontKey];
            const isSelected = fontKey === selectedFont;
            return (
              <motion.button
                key={fontKey}
                onClick={() => onFontChange(fontKey)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                style={{
                  fontFamily: config.fontFamily || 'inherit',
                  fontWeight: config.fontWeight || '400',
                  fontStyle: config.fontStyle || 'normal',
                  letterSpacing: config.letterSpacing ?? 0,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {config.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Effects */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white/80">Text Effect</h3>
        <div className="grid grid-cols-5 gap-2">
          {NAME_EFFECT_KEYS.map((effectKey) => {
            const config = NAME_EFFECTS[effectKey];
            const isSelected = effectKey === selectedEffect;
            return (
              <motion.button
                key={effectKey}
                onClick={() => onEffectChange(effectKey)}
                className={`rounded-lg px-3 py-2.5 text-center transition-all ${
                  isSelected
                    ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="text-sm font-medium">{config.label}</div>
                <div className="mt-0.5 text-[10px] opacity-60">{config.description}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white/80">
          {needsSecondary ? 'Primary Color' : 'Text Color'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {NAME_COLORS.map((color) => (
            <motion.button
              key={color}
              onClick={() => onColorChange(color)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                color === selectedColor
                  ? 'scale-110 border-white'
                  : 'border-transparent hover:border-white/40'
              }`}
              style={{ backgroundColor: color }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
          {/* Custom color input */}
          <div className="relative">
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                onColorChange(e.target.value);
              }}
              className="absolute inset-0 h-8 w-8 cursor-pointer opacity-0"
            />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs ${
                !NAME_COLORS.includes(selectedColor) ? 'border-white' : 'border-white/20'
              }`}
              style={{ backgroundColor: customColor }}
            >
              +
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Color (for gradient/neon/pop) */}
      {needsSecondary && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={tweens.fast}
        >
          <h3 className="mb-3 text-sm font-semibold text-white/80">Secondary Color</h3>
          <div className="flex flex-wrap gap-2">
            {NAME_COLORS.map((color) => (
              <motion.button
                key={color}
                onClick={() => onSecondaryColorChange(color)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  color === selectedSecondaryColor
                    ? 'scale-110 border-white'
                    : 'border-transparent hover:border-white/40'
                }`}
                style={{ backgroundColor: color }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
