/**
 * Layout Editor — Layout category
 *
 * Sidebar position, header style, thread/post/category/board layouts,
 * sticky header, breadcrumbs.
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface LayoutEditorProps {
  options: Record<string, unknown>;
  onSave: (changes: Record<string, unknown>) => void;
  saving: boolean;
}

const SIDEBAR_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'none', label: 'None' },
];

const HEADER_STYLES = [
  { value: 'standard', label: 'Standard' },
  { value: 'compact', label: 'Compact' },
  { value: 'banner', label: 'Banner' },
  { value: 'minimal', label: 'Minimal' },
];

const LAYOUT_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'cards', label: 'Cards' },
  { value: 'compact', label: 'Compact' },
];

const CATEGORY_LAYOUTS = [
  { value: 'table', label: 'Table' },
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
];

/** Description. */
/** Layout Editor component. */
export function LayoutEditor({ options, onSave, saving }: LayoutEditorProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setDraft({ ...options });
  }, [options]);

  const updateField = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Sidebar Position */}
      <div>
        <label className="mb-2 block text-xs text-white/50">Sidebar Position</label>
        <div className="flex gap-2">
          {SIDEBAR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateField('sidebar_position', opt.value)}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                draft.sidebar_position === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header Style */}
      <div>
        <label className="mb-2 block text-xs text-white/50">Header Style</label>
        <div className="flex gap-2">
          {HEADER_STYLES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateField('header_style', opt.value)}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                draft.header_style === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thread / Post / Category / Board Layouts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-white/50">Thread Layout</label>
          <select
             
            value={(draft.thread_layout as string) ?? 'classic'}
            onChange={(e) => updateField('thread_layout', e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          >
            {LAYOUT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Post Layout</label>
          <select
             
            value={(draft.post_layout as string) ?? 'classic'}
            onChange={(e) => updateField('post_layout', e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          >
            {LAYOUT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Category Layout</label>
          <select
             
            value={(draft.category_layout as string) ?? 'table'}
            onChange={(e) => updateField('category_layout', e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          >
            {CATEGORY_LAYOUTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Board Layout</label>
          <select
             
            value={(draft.board_layout as string) ?? 'table'}
            onChange={(e) => updateField('board_layout', e.target.value)}
            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          >
            {CATEGORY_LAYOUTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {[
          { key: 'sticky_header', label: 'Sticky Header' },
          { key: 'show_breadcrumbs', label: 'Show Breadcrumbs' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <button
              onClick={() => updateField(key, !draft[key])}
              className={`relative h-5 w-10 rounded-full transition-colors ${
                draft[key] ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  draft[key] ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
            <label className="text-sm text-white/70">{label}</label>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={() => onSave(draft)}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>
    </div>
  );
}

export default LayoutEditor;
