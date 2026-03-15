/**
 * Badge Manager — Badge CRUD with image upload
 *
 * Create, edit, delete badges with name, description, image, and award criteria.
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import { CheckIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { BadgeConfig } from '@cgraph/shared-types';

interface BadgeManagerProps {
  forumId?: string;
  onSave?: (changes: Record<string, unknown>) => void;
  saving?: boolean;
}

const DEFAULT_BADGE: BadgeConfig = {
  id: '',
  name: '',
  description: '',
  imageUrl: '',
  criteria: 'manual',
  threshold: 0,
  color: '#3B82F6',
};

/** Description. */
/** Badge Manager component. */
export function BadgeManager({ forumId, onSave, saving }: BadgeManagerProps) {
  const [badges, setBadges] = useState<BadgeConfig[]>([]);
  const [editing, setEditing] = useState<BadgeConfig | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Load existing badges
    if (forumId) {
      fetch(`/api/v1/forums/${forumId}/customization`)
        .then((r) => r.json())
        .then((json) => {
          const stored = json.data?.post_and_thread_display?.badges ?? [];
          setBadges(stored);
        })
        .catch(() => {});
    }
  }, [forumId]);

  const handleAddBadge = useCallback(() => {
    setEditing({ ...DEFAULT_BADGE, id: crypto.randomUUID() });
    setShowForm(true);
  }, []);

  const handleSaveBadge = useCallback(() => {
    if (!editing) return;
    setBadges((prev) => {
      const exists = prev.find((b) => b.id === editing.id);
      if (exists) {
        return prev.map((b) => (b.id === editing.id ? editing : b));
      }
      return [...prev, editing];
    });
    setShowForm(false);
    setEditing(null);
  }, [editing]);

  const handleDeleteBadge = useCallback((id: string) => {
    setBadges((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleSaveAll = useCallback(() => {
    onSave?.({ badges });
  }, [badges, onSave]);

  return (
    <div className="space-y-6">
      {/* Badge List */}
      <div className="space-y-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            {badge.imageUrl ? (
              <img src={badge.imageUrl} alt={badge.name} className="h-8 w-8 rounded" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded text-xs font-bold text-white"
                style={{ backgroundColor: badge.color }}
              >
                {badge.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{badge.name}</div>
              <div className="text-xs text-white/40">{badge.description || 'No description'}</div>
            </div>
            <div className="text-xs capitalize text-white/30">{badge.criteria}</div>
            <button
              onClick={() => {
                setEditing(badge);
                setShowForm(true);
              }}
              className="rounded p-1.5 text-white/40 hover:bg-white/10 hover:text-white/70"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteBadge(badge.id)}
              className="rounded p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-400"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
        {badges.length === 0 && (
          <div className="py-8 text-center text-sm text-white/30">
            No badges created yet. Add your first badge below.
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={handleAddBadge}
        className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
      >
        <PlusIcon className="h-4 w-4" />
        Add Badge
      </button>

      {/* Edit Form */}
      {showForm && editing && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="text-sm font-semibold text-white/80">
            {badges.find((b) => b.id === editing.id) ? 'Edit' : 'New'} Badge
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Name</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Color</label>
              <input
                type="color"
                value={editing.color}
                onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                className="h-8 w-full cursor-pointer rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-white/50">Description</label>
              <input
                type="text"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Image URL</label>
              <input
                type="url"
                value={editing.imageUrl}
                onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Award Criteria</label>
              <select
                value={editing.criteria}
                onChange={(e) =>
                   
                  setEditing({ ...editing, criteria: e.target.value as BadgeConfig['criteria'] })
                }
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
              >
                <option value="manual">Manual</option>
                <option value="post_count">Post Count</option>
                <option value="karma">Pulse Threshold</option>
                <option value="registration_age">Registration Age</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="rounded px-3 py-1.5 text-sm text-white/50 hover:text-white/70"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBadge}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
            >
              Save Badge
            </button>
          </div>
        </div>
      )}

      {/* Save All */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Badges'}
        </button>
      </div>
    </div>
  );
}

export default BadgeManager;
