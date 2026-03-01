/**
 * Theme Editor — Appearance category
 *
 * Color pickers (6 colors), font selectors, border radius,
 * dark mode toggle, and preset selector.
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface ThemeEditorProps {
  options: Record<string, unknown>;
  onSave: (changes: Record<string, unknown>) => void;
  saving: boolean;
}

const COLOR_FIELDS = [
  { key: 'primary_color', label: 'Primary Color' },
  { key: 'secondary_color', label: 'Secondary Color' },
  { key: 'accent_color', label: 'Accent Color' },
  { key: 'background_color', label: 'Background Color' },
  { key: 'text_color', label: 'Text Color' },
  { key: 'link_color', label: 'Link Color' },
];

const FONT_OPTIONS = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  'Fira Code, monospace',
  'Poppins, sans-serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Merriweather, serif',
  'Source Code Pro, monospace',
];

const BORDER_RADIUS_OPTIONS = ['none', 'sm', 'md', 'lg', 'full'];
const FONT_SIZE_OPTIONS = ['14px', '15px', '16px', '18px'];
const WIDTH_OPTIONS = ['960px', '1080px', '1200px', '1440px', 'full'];

const PRESETS = {
  'dark-elite': { primary_color: '#BB86FC', secondary_color: '#03DAC6', accent_color: '#CF6679', background_color: '#121212', text_color: '#E0E0E0', link_color: '#BB86FC' },
  cyberpunk: { primary_color: '#00F0FF', secondary_color: '#FF00FF', accent_color: '#FCEE0A', background_color: '#0a0a0a', text_color: '#e0e0e0', link_color: '#00F0FF' },
  'classic-mybb': { primary_color: '#0F4C81', secondary_color: '#1565C0', accent_color: '#FF8F00', background_color: '#FFFFFF', text_color: '#212121', link_color: '#0F4C81' },
  forest: { primary_color: '#2D6A4F', secondary_color: '#40916C', accent_color: '#95D5B2', background_color: '#1B4332', text_color: '#D8F3DC', link_color: '#74C69D' },
  ocean: { primary_color: '#0077B6', secondary_color: '#00B4D8', accent_color: '#90E0EF', background_color: '#03045E', text_color: '#CAF0F8', link_color: '#48CAE4' },
  sunset: { primary_color: '#E63946', secondary_color: '#F4A261', accent_color: '#E9C46A', background_color: '#264653', text_color: '#F1FAEE', link_color: '#E76F51' },
  neon: { primary_color: '#39FF14', secondary_color: '#FF073A', accent_color: '#FF6EC7', background_color: '#0D0D0D', text_color: '#FFFFFF', link_color: '#39FF14' },
  monochrome: { primary_color: '#FFFFFF', secondary_color: '#CCCCCC', accent_color: '#999999', background_color: '#111111', text_color: '#E5E5E5', link_color: '#FFFFFF' },
};

export function ThemeEditor({ options, onSave, saving }: ThemeEditorProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setDraft({ ...options });
  }, [options]);

  const updateField = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey as keyof typeof PRESETS];
    if (preset) {
      setDraft((prev) => ({ ...prev, ...preset }));
    }
  }, []);

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  return (
    <div className="space-y-8">
      {/* Presets */}
      <section>
        <h4 className="text-sm font-semibold text-white/80 mb-3">Theme Presets</h4>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primary_color }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.secondary_color }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accent_color }} />
              </div>
              <span className="text-[10px] text-white/50 capitalize">{key.replace('-', ' ')}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Colors */}
      <section>
        <h4 className="text-sm font-semibold text-white/80 mb-3">Colors</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-white/50 mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(draft[key] as string) ?? '#000000'}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer border border-white/10"
                />
                <input
                  type="text"
                  value={(draft[key] as string) ?? ''}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Font */}
      <section>
        <h4 className="text-sm font-semibold text-white/80 mb-3">Typography</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Font Family</label>
            <select
              value={(draft.font_family as string) ?? 'Inter, system-ui, sans-serif'}
              onChange={(e) => updateField('font_family', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f.split(',')[0]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Base Font Size</label>
            <select
              value={(draft.font_size_base as string) ?? '16px'}
              onChange={(e) => updateField('font_size_base', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
            >
              {FONT_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Border Radius</label>
            <select
              value={(draft.border_radius as string) ?? 'md'}
              onChange={(e) => updateField('border_radius', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
            >
              {BORDER_RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Content Width & Dark Mode */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Content Width</label>
            <select
              value={(draft.content_width as string) ?? '1200px'}
              onChange={(e) => updateField('content_width', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
            >
              {WIDTH_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => updateField('dark_mode', !draft.dark_mode)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                draft.dark_mode ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  draft.dark_mode ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
            <label className="text-sm text-white/70">Dark Mode Default</label>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <CheckIcon className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Appearance'}
        </button>
      </div>
    </div>
  );
}

export default ThemeEditor;
