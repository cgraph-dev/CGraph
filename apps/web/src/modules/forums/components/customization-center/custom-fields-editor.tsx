/**
 * Custom Fields Editor — CRUD for custom fields per target entity
 *
 * Create, edit, and delete custom fields for threads, posts, and profiles.
 * Supports field types: text, number, select, checkbox, date, url.
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
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

/** Description. */
/** Custom Fields Editor component. */
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

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/v1/forums/${forumId}/custom-fields/${id}`, { method: 'DELETE' });
        fetchFields();
      } catch {
        // Silently fail
      }
    },
    [forumId, fetchFields]
  );

  return (
    <div className="space-y-6">
      {/* Target Tabs */}
      <div className="flex gap-2">
        {TARGETS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTarget(t.value)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
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
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{field.name}</div>
              <div className="text-xs text-white/40">
                {field.fieldType} {field.required ? '• Required' : '• Optional'}
              </div>
            </div>
            <span className="text-xs capitalize text-white/30">{field.visibleTo}</span>
            <button
              onClick={() => setEditing(field)}
              className="rounded p-1.5 text-white/40 hover:bg-white/10"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(field.id)}
              className="rounded p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-400"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
        {!loading && fields.length === 0 && (
          <div className="py-8 text-center text-sm text-white/30">
            No custom fields for {activeTarget}s. Add one below.
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() =>
          setEditing({
            name: '',
            fieldType: 'text',
             
            target: activeTarget as CustomFieldTarget,
            required: false,
            position: fields.length,
            visibleTo: 'all',
            options: [],
          })
        }
        className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
      >
        <PlusIcon className="h-4 w-4" />
        Add Field
      </button>

      {/* Edit Form */}
      {editing && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="text-sm font-semibold text-white/80">
            {editing.id ? 'Edit' : 'New'} Custom Field
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Name</label>
              <input
                type="text"
                value={editing.name ?? ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Type</label>
              <select
                value={editing.fieldType ?? 'text'}
                onChange={(e) =>
                   
                  setEditing({ ...editing, fieldType: e.target.value as CustomFieldType })
                }
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Visible To</label>
              <select
                value={editing.visibleTo ?? 'all'}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                     
                    visibleTo: e.target.value as 'all' | 'members' | 'mods' | 'admins',
                  })
                }
                className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
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
                <label className="mb-1 block text-xs text-white/50">
                  Options (comma-separated)
                </label>
                <input
                  type="text"
                  value={(editing.options ?? []).join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      options: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(null)}
              className="px-3 py-1.5 text-sm text-white/50 hover:text-white/70"
            >
              Cancel
            </button>
            <button
              onClick={editing.id ? handleUpdate : handleCreate}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
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
