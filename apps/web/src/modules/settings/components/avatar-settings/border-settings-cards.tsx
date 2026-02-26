/**
 * BorderSettingsCards component
 * @module modules/settings/components/avatar-settings
 */

import { GlassCard, useAvatarStyle } from '@/shared/components/ui';

/**
 * unknown for the settings module.
 */
/**
 * Border Width Card display component.
 */
export function BorderWidthCard() {
  const { style, updateStyle } = useAvatarStyle();

  return (
    <GlassCard className="p-6" variant="frosted">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Border Width</h3>
        <span className="text-sm text-primary-400">{style.borderWidth}px</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={style.borderWidth}
        onChange={(e) => updateStyle('borderWidth', parseInt(e.target.value))}
        className="slider-thumb-primary h-2 w-full cursor-pointer appearance-none rounded-lg bg-dark-700"
      />
    </GlassCard>
  );
}

/**
 * unknown for the settings module.
 */
/**
 * Border Color Card display component.
 */
export function BorderColorCard() {
  const { style, updateStyle } = useAvatarStyle();

  return (
    <GlassCard className="p-6" variant="frosted">
      <h3 className="mb-4 text-lg font-semibold text-white">Border Color</h3>
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={style.borderColor}
          onChange={(e) => updateStyle('borderColor', e.target.value)}
          className="h-12 w-24 cursor-pointer rounded-lg border border-dark-600 bg-transparent"
        />
        <div className="flex-1">
          <p className="text-sm text-gray-400">Selected Color</p>
          <p className="font-mono text-lg text-white">{style.borderColor}</p>
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * unknown for the settings module.
 */
/**
 * Glow Intensity Card display component.
 */
export function GlowIntensityCard() {
  const { style, updateStyle } = useAvatarStyle();

  return (
    <GlassCard className="p-6" variant="frosted">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Glow Intensity</h3>
        <span className="text-sm text-primary-400">{style.glowIntensity}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={style.glowIntensity}
        onChange={(e) => updateStyle('glowIntensity', parseInt(e.target.value))}
        className="slider-thumb-primary h-2 w-full cursor-pointer appearance-none rounded-lg bg-dark-700"
      />
    </GlassCard>
  );
}
