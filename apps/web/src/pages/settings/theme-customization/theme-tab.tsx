/* eslint-disable @typescript-eslint/consistent-type-assertions */
/**
 * Theme selection and customization tab.
 * @module
 */
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import type { ThemeColorPreset } from './types';
import { THEME_PRESETS } from './constants';

/**
 * unknown for the settings module.
 */
/**
 * Theme Tab component.
 */
export function ThemeTab() {
  const { theme, setColorPreset, applyPreset } = useThemeStore();

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div className="rounded-xl border border-gray-800 bg-[rgb(30,32,40)]/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Quick Presets</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4 text-left transition-all hover:bg-white/[0.04]"
            >
              <div className="mb-1 text-sm font-medium">{preset.name}</div>
              <div className="text-xs text-gray-400">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Themes */}
      <div className="rounded-xl border border-gray-800 bg-[rgb(30,32,40)]/50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Color Theme</h3>
        <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
          {(Object.keys(THEME_COLORS) as ThemeColorPreset[]).map((colorKey) => {
            // safe downcast – structural boundary
            const color = THEME_COLORS[colorKey];
            return (
              <button
                key={colorKey}
                onClick={() => setColorPreset(colorKey)}
                className={`relative aspect-square rounded-lg transition-all ${
                  theme.colorPreset === colorKey ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                }}
                title={color.name}
              >
                {theme.colorPreset === colorKey && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
