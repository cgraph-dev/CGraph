/**
 * unknown.
 * AI Theme Demo Section
 */

import { useState } from 'react';
import { GlassCard } from '@/shared/components/ui';
import { themeEngine as aiThemeEngine } from '@/lib/ai/theme-engine';
import { HapticFeedback } from '@/lib/animations/animation-engine';

/**
 * Theme Demo component.
 */
export function ThemeDemo() {
  const [generatedTheme, setGeneratedTheme] = useState<ReturnType<
    typeof aiThemeEngine.getRecommendedTheme
  > | null>(null);

  const generateTheme = () => {
    const theme = aiThemeEngine.getRecommendedTheme();
    setGeneratedTheme(theme);
    aiThemeEngine.applyTheme(theme);
    HapticFeedback.medium();
  };

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">AI Theme Engine</h2>
      <p className="mb-4 text-gray-400">
        Generates adaptive color themes based on time, user preferences, and activity
      </p>

      <div className="mb-6 flex gap-4">
        <button
          onClick={generateTheme}
          className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-500"
        >
          🎨 Generate Theme
        </button>
      </div>

      {generatedTheme && (
        <GlassCard variant="frosted" className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Generated Theme</h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Object.entries(generatedTheme.colors)
              .slice(0, 8)
              .map(([name, color]) => (
                <div key={name} className="text-center">
                  <div
                    className="mb-2 h-16 w-full rounded-lg border border-white/10"
                    style={{
                       
                      background: color as string /* type assertion: theme color value is string */,
                    }}
                  />
                  <p className="text-xs capitalize text-gray-400">{name}</p>
                  <p className="font-mono text-xs text-gray-500">
                    { }
                    {color as string /* type assertion: theme color value is string */}
                  </p>
                </div>
              ))}
          </div>

          <div className="mt-6 rounded-lg bg-black/30 p-4">
            <p className="text-sm text-gray-400">
              <strong>Mood:</strong> {generatedTheme.metadata.mood}
            </p>
            <p className="text-sm text-gray-400">
              <strong>Name:</strong> {generatedTheme.metadata.name}
            </p>
            <p className="text-sm text-gray-400">
              <strong>Contrast Ratio:</strong> {generatedTheme.metadata.contrastRatio.toFixed(2)}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
