/**
 * Karma Settings — Reputation & Ranks category
 *
 * Karma name, upvote/downvote labels, rank thresholds,
 * rank image upload, show reputation toggle.
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import { CheckIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { RankThreshold } from '@cgraph/shared-types';

interface KarmaSettingsProps {
  options: Record<string, unknown>;
  onSave: (changes: Record<string, unknown>) => void;
  saving: boolean;
}

const DEFAULT_THRESHOLDS: RankThreshold[] = [
  { name: 'Newcomer', minKarma: 0, imageUrl: '' },
  { name: 'Member', minKarma: 10, imageUrl: '' },
  { name: 'Regular', minKarma: 50, imageUrl: '' },
  { name: 'Veteran', minKarma: 200, imageUrl: '' },
  { name: 'Elite', minKarma: 500, imageUrl: '' },
];

/** Description. */
/** Karma Settings component. */
export function KarmaSettings({ options, onSave, saving }: KarmaSettingsProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [thresholds, setThresholds] = useState<RankThreshold[]>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    setDraft({ ...options });
    const stored = options.rank_thresholds;
    if (Array.isArray(stored) && stored.length > 0) {
      setThresholds(
        stored.map((t: Record<string, unknown>) => ({
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          name: (t.name as string) ?? '',
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          minKarma: (t.min_karma as number) ?? (t.minKarma as number) ?? 0,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          imageUrl: (t.image_url as string) ?? (t.imageUrl as string) ?? '',
        }))
      );
    }
  }, [options]);

  const updateField = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateThreshold = useCallback(
    (index: number, field: keyof RankThreshold, value: unknown) => {
      setThresholds((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
    },
    []
  );

  const addThreshold = useCallback(() => {
    setThresholds((prev) => [
      ...prev,
      {
        name: '',
        minKarma: prev.length > 0 ? (prev[prev.length - 1]?.minKarma ?? 0) + 100 : 0,
        imageUrl: '',
      },
    ]);
  }, []);

  const removeThreshold = useCallback((index: number) => {
    setThresholds((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      ...draft,
      rank_thresholds: thresholds.map((t) => ({
        name: t.name,
        min_karma: t.minKarma,
        image_url: t.imageUrl,
      })),
    });
  }, [draft, thresholds, onSave]);

  return (
    <div className="space-y-6">
      {/* Karma Name & Labels */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-white/50">Karma Name</label>
          <input
            type="text"
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            value={(draft.karma_name as string) ?? 'Karma'}
            onChange={(e) => updateField('karma_name', e.target.value)}
            placeholder="Karma"
            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Upvote Label</label>
          <input
            type="text"
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            value={(draft.upvote_label as string) ?? 'Upvote'}
            onChange={(e) => updateField('upvote_label', e.target.value)}
            placeholder="Upvote"
            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Downvote Label</label>
          <input
            type="text"
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            value={(draft.downvote_label as string) ?? 'Downvote'}
            onChange={(e) => updateField('downvote_label', e.target.value)}
            placeholder="Downvote"
            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
          />
        </div>
      </div>

      {/* Show Reputation Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => updateField('show_reputation', !draft.show_reputation)}
          className={`relative h-5 w-10 rounded-full transition-colors ${
            draft.show_reputation !== false ? 'bg-green-500' : 'bg-white/20'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              draft.show_reputation !== false ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
        <label className="text-sm text-white/70">Show Reputation on Profiles & Posts</label>
      </div>

      {/* Rank Thresholds */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-white/80">Rank Thresholds</h4>
        <div className="space-y-2">
          {thresholds.map((threshold, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2"
            >
              <div className="grid flex-1 grid-cols-3 gap-2">
                <input
                  type="text"
                  value={threshold.name}
                  onChange={(e) => updateThreshold(index, 'name', e.target.value)}
                  placeholder="Rank name"
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                />
                <input
                  type="number"
                  value={threshold.minKarma}
                  onChange={(e) =>
                    updateThreshold(index, 'minKarma', parseInt(e.target.value) || 0)
                  }
                  placeholder="Min karma"
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                />
                <input
                  type="url"
                  value={threshold.imageUrl}
                  onChange={(e) => updateThreshold(index, 'imageUrl', e.target.value)}
                  placeholder="Image URL"
                  className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                />
              </div>
              <button
                onClick={() => removeThreshold(index)}
                className="rounded p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-400"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addThreshold}
          className="mt-2 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/10"
        >
          <PlusIcon className="h-4 w-4" />
          Add Rank
        </button>
      </div>

      {/* Save */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Reputation & Ranks'}
        </button>
      </div>
    </div>
  );
}

export default KarmaSettings;
