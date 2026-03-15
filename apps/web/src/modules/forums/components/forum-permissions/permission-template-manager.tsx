 
/**
 * Permission Template Manager
 *
 * List templates (system presets + custom), create, apply to board, duplicate.
 *
 * @module modules/forums/components/forum-permissions/permission-template-manager
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
  PlayIcon,
  ClipboardDocumentListIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import {
  usePermissionsStore,
  type PermLevel,
  type PermissionTemplateLocal,
  type CreateTemplateData,
} from '../../store/forumStore.permissions';
import { BOARD_PERMISSIONS } from '../forum-permissions/types';

interface PermissionTemplateManagerProps {
  forumId: string;
  boardId?: string;
}

/** Description. */
/** Permission Template Manager component. */
export function PermissionTemplateManager({ forumId, boardId }: PermissionTemplateManagerProps) {
  const {
    templates,
    isLoadingTemplates,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    applyTemplate,
    duplicateTemplate,
  } = usePermissionsStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PermissionTemplateLocal | null>(null);

  useEffect(() => {
    fetchTemplates(forumId);
  }, [forumId, fetchTemplates]);

  const handleApply = useCallback(
    async (templateId: string) => {
      if (!boardId) {
        alert('Select a board first to apply the template.');
        return;
      }
      if (
        !window.confirm(
          'Apply this template to the selected board? Current permissions will be overwritten.'
        )
      )
        return;
      setApplyingId(templateId);
      try {
        await applyTemplate(boardId, templateId);
      } finally {
        setApplyingId(null);
      }
    },
    [boardId, applyTemplate]
  );

  const handleDuplicate = useCallback(
    async (template: PermissionTemplateLocal) => {
      const newName = window.prompt('Name for the duplicate?', `${template.name} (Copy)`);
      if (!newName?.trim()) return;
      await duplicateTemplate(forumId, template.id, newName.trim());
    },
    [forumId, duplicateTemplate]
  );

  const handleDelete = useCallback(
    async (template: PermissionTemplateLocal) => {
      if (template.isSystem) return;
      if (!window.confirm(`Delete template "${template.name}"?`)) return;
      await deleteTemplate(forumId, template.id);
    },
    [forumId, deleteTemplate]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-500" />
          <h2 className="text-xl font-bold">Permission Templates</h2>
          <span className="text-sm text-gray-400">({templates.length} templates)</span>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Template list */}
      {isLoadingTemplates && templates.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {templates.map((tmpl) => (
            <motion.div
              key={tmpl.id}
              layout
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{tmpl.name}</span>
                    {tmpl.isSystem && (
                      <span className="flex items-center gap-1 rounded bg-blue-900 px-1.5 py-0.5 text-xs text-blue-300">
                        <LockClosedIcon className="h-3 w-3" /> System
                      </span>
                    )}
                  </div>
                  {tmpl.description && (
                    <p className="mt-1 text-sm text-gray-400">{tmpl.description}</p>
                  )}
                </div>
              </div>

              {/* Permission summary */}
              <div className="mb-3 flex flex-wrap gap-1">
                {Object.entries(tmpl.permissions)
                  .slice(0, 6)
                  .map(([key, val]) => (
                    <span
                      key={key}
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        val === 'allow'
                          ? 'bg-green-900/50 text-green-400'
                          : val === 'deny'
                            ? 'bg-red-900/50 text-red-400'
                            : 'bg-white/[0.06] text-gray-400'
                      }`}
                    >
                      {key.replace(/^can_/, '')}
                    </span>
                  ))}
                {Object.keys(tmpl.permissions).length > 6 && (
                  <button
                    onClick={() => setPreviewTemplate(tmpl)}
                    className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-gray-300 hover:bg-white/[0.10]"
                  >
                    +{Object.keys(tmpl.permissions).length - 6} more
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {boardId && (
                  <button
                    onClick={() => handleApply(tmpl.id)}
                    disabled={applyingId === tmpl.id}
                    className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    <PlayIcon className="h-3 w-3" />
                    {applyingId === tmpl.id ? 'Applying...' : 'Apply to Board'}
                  </button>
                )}
                <button
                  onClick={() => handleDuplicate(tmpl)}
                  className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:text-white"
                >
                  <DocumentDuplicateIcon className="h-3 w-3" />
                  Duplicate
                </button>
                {!tmpl.isSystem && (
                  <button
                    onClick={() => handleDelete(tmpl)}
                    className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:text-red-400"
                  >
                    <TrashIcon className="h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {templates.length === 0 && !isLoadingTemplates && (
        <div className="py-8 text-center text-gray-400">
          <ClipboardDocumentListIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No templates yet. Create one to quickly configure board permissions.</p>
        </div>
      )}

      {/* Template Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <TemplatePreview template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
        )}
      </AnimatePresence>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateTemplateForm
            onSave={async (data) => {
              await createTemplate(forumId, data);
              setShowCreateForm(false);
            }}
            onClose={() => setShowCreateForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Template Preview ─────────────────────────────────────────────────────

function TemplatePreview({
  template,
  onClose,
}: {
  template: PermissionTemplateLocal;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold">{template.name}</h3>
        <div className="space-y-2">
          {Object.entries(template.permissions).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-300">
                {key.replace(/^can_/, '').replace(/_/g, ' ')}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  val === 'allow'
                    ? 'bg-green-900 text-green-400'
                    : val === 'deny'
                      ? 'bg-red-900 text-red-400'
                      : 'bg-white/[0.06] text-gray-400'
                }`}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-white/[0.08] px-4 py-2 text-gray-400 transition-colors hover:text-white"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Create Template Form ─────────────────────────────────────────────────

function CreateTemplateForm({
  onSave,
  onClose,
}: {
  onSave: (data: CreateTemplateData) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Record<string, PermLevel>>(() => {
    const p: Record<string, PermLevel> = {};
    for (const def of BOARD_PERMISSIONS) {
      p[def.key] = 'inherit';
    }
    return p;
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold">Create Permission Template</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
            />
          </div>

          {/* Permission toggles */}
          <div className="border-t border-white/[0.08] pt-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-300">Permissions</h4>
            <div className="space-y-2">
              {BOARD_PERMISSIONS.map((def) => (
                <div key={def.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{def.label}</span>
                  <div className="flex gap-1">
                    {(['inherit', 'allow', 'deny'] as PermLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setPermissions((p) => ({ ...p, [def.key]: level }))}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          permissions[def.key] === level
                            ? level === 'allow'
                              ? 'bg-green-600 text-white'
                              : level === 'deny'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-600 text-white'
                            : 'bg-white/[0.04] text-gray-500 hover:bg-white/[0.06]'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default PermissionTemplateManager;
