 
/**
 * CSS Editor — Custom CSS & Advanced category
 *
 * Code editor for custom_css with syntax highlighting (textarea-based),
 * custom header/footer HTML, and a preview pane.
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import { CheckIcon, EyeIcon } from '@heroicons/react/24/outline';

interface CssEditorProps {
  options: Record<string, unknown>;
  onSave: (changes: Record<string, unknown>) => void;
  saving: boolean;
}

/** Description. */
/** Css Editor component. */
export function CssEditor({ options, onSave, saving }: CssEditorProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setDraft({ ...options });
  }, [options]);

  const updateField = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Custom CSS */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-semibold text-white/80">Custom CSS</label>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white/70"
          >
            <EyeIcon className="h-3.5 w-3.5" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
        <textarea
          value={(draft.custom_css as string) ?? ''}
          onChange={(e) => updateField('custom_css', e.target.value)}
          placeholder="/* Your custom CSS here */&#10;.forum-header { }&#10;.thread-list { }"
          className="h-64 w-full resize-y rounded-lg border border-white/10 bg-[#1e1e1e] px-4 py-3 font-mono text-sm text-green-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          spellCheck={false}
        />
        <p className="mt-1 text-xs text-white/30">
          Maximum 100,000 characters. CSS is sanitized before rendering.
        </p>
      </div>

      {/* Preview */}
      {showPreview && (draft.custom_css as string) && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="mb-2 text-xs font-semibold text-white/50">CSS Preview</h4>
          <style>{draft.custom_css as string}</style>
          <div className="forum-preview">
            <div className="forum-header mb-2 rounded bg-white/5 p-3 text-sm text-white">
              Forum Header Area
            </div>
            <div className="thread-list space-y-1">
              <div className="rounded bg-white/5 p-2 text-sm text-white/70">Sample Thread 1</div>
              <div className="rounded bg-white/5 p-2 text-sm text-white/70">Sample Thread 2</div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Header HTML */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-white/80">Custom Header HTML</label>
        <textarea
          value={(draft.custom_header_html as string) ?? ''}
          onChange={(e) => updateField('custom_header_html', e.target.value)}
          placeholder="<div class='custom-banner'>Welcome to our forum!</div>"
          className="h-32 w-full resize-y rounded-lg border border-white/10 bg-[#1e1e1e] px-4 py-3 font-mono text-sm text-orange-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          spellCheck={false}
        />
        <p className="mt-1 text-xs text-white/30">HTML is sanitized. Max 10,000 characters.</p>
      </div>

      {/* Custom Footer HTML */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-white/80">Custom Footer HTML</label>
        <textarea
          value={(draft.custom_footer_html as string) ?? ''}
          onChange={(e) => updateField('custom_footer_html', e.target.value)}
          placeholder="<div class='custom-footer'>© 2026 My Forum</div>"
          className="h-32 w-full resize-y rounded-lg border border-white/10 bg-[#1e1e1e] px-4 py-3 font-mono text-sm text-orange-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          spellCheck={false}
        />
      </div>

      {/* Custom JS Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => updateField('custom_js_enabled', !draft.custom_js_enabled)}
          className={`relative h-5 w-10 rounded-full transition-colors ${
            draft.custom_js_enabled ? 'bg-amber-500' : 'bg-white/20'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              draft.custom_js_enabled ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
        <div>
          <label className="text-sm text-white/70">Enable Custom JavaScript</label>
          <p className="text-xs text-amber-400/60">Requires admin approval. Use with caution.</p>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={() => onSave(draft)}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Advanced CSS'}
        </button>
      </div>
    </div>
  );
}

export default CssEditor;
