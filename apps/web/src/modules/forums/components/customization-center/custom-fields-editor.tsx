/**
 * Custom Fields Editor — CRUD for custom fields per target entity
 *
 * Create, edit, and delete custom fields for threads, posts, and profiles.
 * Supports field types: text, number, select, checkbox, date, url.
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import type { CustomField, CustomFieldType, CustomFieldTarget } from '@cgraph/shared-types';

interface CustomFieldsEditorProps {
  forumId: string;
  onSave: (changes: Record<string, unknown>) => void;
  saving: boolean;
}

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
];

const TARGETS = [
  { value: 'thread', label: 'Threads' },
  { value: 'post', label: 'Posts' },
  { value: 'profile', label: 'Profiles' },
];

export function CustomFieldsEditor({ forumId }: CustomFieldsEditorProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [activeTarget, setActiveTarget] = useState('thread');
  const [editing, setEditing] = useState<Partial<CustomField> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/forums/${forumId}/custom-fields?target=${activeTarget}`);
      const json = await res.json();
      setFields(json.data ?? []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [forumId, activeTarget]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleCreate = useCallback(async () => {
    if (!editing?.name) return;
    try {
      const res = await fetch(`/api/v1/forums/${forumId}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editing, target: activeTarget }),
      });
      if (res.ok) {
        setEditing(null);
        fetchFields();
      }
    } catch {
      // Silently fail
    }
  }, [editing, forumId, activeTarget, fetchFields]);

  const handleUpdate = useCallback(async () => {
    if (!editing?.id || !editing?.name) return;
    try {
      const res = await fetch(`/api/v1/forums/${forumId}/custom-fields/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        setEditing(null);
        fetchFields();
      }
    } catch {
      // Silently fail
    }
  }, [editing, forumId, fetchFields]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/v1/forums/${forumId}/custom-fields/${id}`, { method: 'DELETE' });
      fetchFields();
    } catch {
      // Silently fail
    }
  }, [forumId, fetchFields]);

  return (
    <div className="space-y-6">
      {/* Target Tabs */}
      <div className="flex gap-2">
        {TARGETS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTarget(t.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTarget === t.value
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Fields List */}
      <div className="space-y-2">
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="flex-1">
              <div className="text-sm text-white font-medium">{field.name}</div>
              <div className="text-xs text-white/40">
                {field.fieldType} {field.required ? '• Required' : '• Optional'}
              </div>
            </div>
            <span className="text-xs text-white/30 capitalize">{field.visibleTo}</span>
            <button
              onClick={() => setEditing(field)}
              className="p-1.5 rounded hover:bg-white/10 text-white/40"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(field.id)}
              className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
        {!loading && fields.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">
            No custom fields for {activeTarget}s. Add one below.
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() =>
          setEditing({ name: '', fieldType: 'text', target: activeTarget as CustomFieldTarget, required: false, position: fields.length, visibleTo: 'all', options: [] })
        }
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add Field
      </button>

      {/* Edit Form */}
      {editing && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <h4 className="text-sm font-semibold text-white/80">
            {editing.id ? 'Edit' : 'New'} Custom Field
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Name</label>
              <input
                type="text"
                value={editing.name ?? ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Type</label>
              <select
                value={editing.fieldType ?? 'text'}
                onChange={(e) => setEditing({ ...editing, fieldType: e.target.value as CustomFieldType })}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Visible To</label>
              <select
                value={editing.visibleTo ?? 'all'}
                onChange={(e) => setEditing({ ...editing, visibleTo: e.target.value as 'all' | 'members' | 'mods' | 'admins' })}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
              >
                <option value="all">Everyone</option>
                <option value="members">Members</option>
                <option value="mods">Moderators</option>
                <option value="admins">Admins</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                checked={editing.required ?? false}
                onChange={(e) => setEditing({ ...editing, required: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-white/70">Required</span>
            </div>
            {editing.fieldType === 'select' && (
              <div className="col-span-2">
                <label className="block text-xs text-white/50 mb-1">Options (comma-separated)</label>
                <input
                  type="text"
                  value={(editing.options ?? []).join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white"
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm text-white/50 hover:text-white/70">
              Cancel
            </button>
            <button
              onClick={editing.id ? handleUpdate : handleCreate}
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-500"
            >
              {editing.id ? 'Update' : 'Create'} Field
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomFieldsEditor;
