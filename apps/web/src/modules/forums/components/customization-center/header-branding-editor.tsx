/**
 * Header & Branding Editor — Logo, header bg, title font, subtitle, favicon
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface HeaderBrandingEditorProps {
  options: Record<string, unknown>;
  onSave: (changes: Record<string, unknown>) => void;
  saving: boolean;
}

const FONT_OPTIONS = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  'Poppins, sans-serif',
  'Roboto, sans-serif',
  'Playfair Display, serif',
  'Oswald, sans-serif',
  'Montserrat, sans-serif',
  'Source Code Pro, monospace',
];

export function HeaderBrandingEditor({ options, onSave, saving }: HeaderBrandingEditorProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setDraft({ ...options });
  }, [options]);

  const updateField = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <label className="block text-xs text-white/50 mb-1">Logo URL</label>
        <input
          type="url"
          value={(draft.logo_url as string) ?? ''}
          onChange={(e) => updateField('logo_url', e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
        />
        {draft.logo_url && (
          <div className="mt-2 p-2 bg-white/5 rounded inline-block">
            <img src={draft.logo_url as string} alt="Logo preview" className="h-12 object-contain" />
          </div>
        )}
      </div>

      {/* Header Background */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1">Header Background Image</label>
          <input
            type="url"
            value={(draft.header_background_url as string) ?? ''}
            onChange={(e) => updateField('header_background_url', e.target.value)}
            placeholder="https://example.com/header-bg.jpg"
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Header Background Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(draft.header_background_color as string) ?? '#1F2937'}
              onChange={(e) => updateField('header_background_color', e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border border-white/10"
            />
            <input
              type="text"
              value={(draft.header_background_color as string) ?? '#1F2937'}
              onChange={(e) => updateField('header_background_color', e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Title Font & Subtitle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1">Title Font</label>
          <select
            value={(draft.title_font as string) ?? 'Inter, system-ui, sans-serif'}
            onChange={(e) => updateField('title_font', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f.split(',')[0]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Subtitle</label>
          <input
            type="text"
            value={(draft.subtitle_text as string) ?? ''}
            onChange={(e) => updateField('subtitle_text', e.target.value)}
            placeholder="Your forum subtitle"
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
          />
        </div>
      </div>

      {/* Favicon */}
      <div>
        <label className="block text-xs text-white/50 mb-1">Favicon URL</label>
        <input
          type="url"
          value={(draft.favicon_url as string) ?? ''}
          onChange={(e) => updateField('favicon_url', e.target.value)}
          placeholder="https://example.com/favicon.ico"
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
        />
      </div>

      {/* Preview */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div
          className="p-4"
          style={{
            backgroundColor: (draft.header_background_color as string) ?? '#1F2937',
            backgroundImage: draft.header_background_url ? `url(${draft.header_background_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex items-center gap-3">
            {draft.logo_url && (
              <img src={draft.logo_url as string} alt="" className="h-10 object-contain" />
            )}
            <div>
              <h3
                className="text-lg font-bold text-white"
                style={{ fontFamily: (draft.title_font as string) ?? 'Inter, system-ui, sans-serif' }}
              >
                Forum Title
              </h3>
              {draft.subtitle_text && (
                <p className="text-xs text-white/60">{draft.subtitle_text as string}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <button
          onClick={() => onSave(draft)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <CheckIcon className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Header & Branding'}
        </button>
      </div>
    </div>
  );
}

export default HeaderBrandingEditor;
