/**
 * Typography Settings Tab Component
 * Allows users to customize font settings and text spacing
 */

import { GlassCard } from '@/shared/components/ui';
import type { SettingsTabProps, UIPreferences } from './types';
import { Select } from './controls';

export function TypographySettings({ preferences, updatePreference }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Font Settings</h3>
        <div className="space-y-4">
          <Select
            label="Font Size"
            value={preferences.fontSize}
            onChange={(value) => updatePreference('fontSize', value as UIPreferences['fontSize'])}
            options={[
              { value: 'small', label: 'Small (14px)' },
              { value: 'medium', label: 'Medium (16px)' },
              { value: 'large', label: 'Large (18px)' },
              { value: 'xlarge', label: 'Extra Large (20px)' },
            ]}
          />
          <Select
            label="Font Family"
            value={preferences.fontFamily}
            onChange={(value) =>
              updatePreference('fontFamily', value as UIPreferences['fontFamily'])
            }
            options={[
              { value: 'system', label: 'System Default' },
              { value: 'inter', label: 'Inter (Recommended)' },
              { value: 'jetbrains', label: 'JetBrains Mono' },
              { value: 'comic-sans', label: 'Comic Sans (Why?)' },
            ]}
          />
          <Select
            label="Font Weight"
            value={preferences.fontWeight}
            onChange={(value) =>
              updatePreference('fontWeight', value as UIPreferences['fontWeight'])
            }
            options={[
              { value: 'light', label: 'Light (300)' },
              { value: 'normal', label: 'Normal (400)' },
              { value: 'medium', label: 'Medium (500)' },
              { value: 'semibold', label: 'Semibold (600)' },
              { value: 'bold', label: 'Bold (700)' },
            ]}
          />
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Text Spacing</h3>
        <div className="space-y-4">
          <Select
            label="Line Height"
            value={preferences.lineHeight}
            onChange={(value) =>
              updatePreference('lineHeight', value as UIPreferences['lineHeight'])
            }
            options={[
              { value: 'compact', label: 'Compact (1.2)' },
              { value: 'normal', label: 'Normal (1.5)' },
              { value: 'relaxed', label: 'Relaxed (1.75)' },
              { value: 'loose', label: 'Loose (2)' },
            ]}
          />
          <Select
            label="Letter Spacing"
            value={preferences.letterSpacing}
            onChange={(value) =>
              updatePreference('letterSpacing', value as UIPreferences['letterSpacing'])
            }
            options={[
              { value: 'tight', label: 'Tight (-0.05em)' },
              { value: 'normal', label: 'Normal (0)' },
              { value: 'wide', label: 'Wide (0.05em)' },
              { value: 'wider', label: 'Wider (0.1em)' },
            ]}
          />
        </div>
      </GlassCard>
    </div>
  );
}
