/**
 * Badge Manager — Badge CRUD with image upload
 *
 * Create, edit, delete badges with name, description, image, and award criteria.
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import {
  CheckIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
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
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10"
          >
            {badge.imageUrl ? (
              <img src={badge.imageUrl} alt={badge.name} className="w-8 h-8 rounded" />
            ) : (
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: badge.color }}
              >
                {badge.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm text-white font-medium">{badge.name}</div>
              <div className="text-xs text-white/40">{badge.description || 'No description'}</div>
            </div>
            <div className="text-xs text-white/30 capitalize">{badge.criteria}</div>
            <button
              onClick={() => {
                setEditing(badge);
                setShowForm(true);
              }}
              className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/70"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteBadge(badge.id)}
              className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
        {badges.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">
            No badges created yet. Add your first badge below.
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={handleAddBadge}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add Badge
      </button>

      {/* Edit Form */}
      {showForm && editing && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <h4 className="text-sm font-semibold text-white/80">
            {badges.find((b) => b.id === editing.id) ? 'Edit' : 'New'} Badge
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Name</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Color</label>
              <input
                type="color"
                value={editing.color}
                onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-white/50 mb-1">Description</label>
              <input
                type="text"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Image URL</label>
              <input
                type="url"
                value={editing.imageUrl}
                onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Award Criteria</label>
              <select
                value={editing.criteria}
                onChange={(e) => setEditing({ ...editing, criteria: e.target.value as BadgeConfig['criteria'] })}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
              >
                <option value="manual">Manual</option>
                <option value="post_count">Post Count</option>
                <option value="karma">Karma Threshold</option>
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
              className="px-3 py-1.5 rounded text-sm text-white/50 hover:text-white/70"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBadge}
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-500"
            >
              Save Badge
            </button>
          </div>
        </div>
      )}

      {/* Save All */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <CheckIcon className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Badges'}
        </button>
      </div>
    </div>
  );
}

export default BadgeManager;
