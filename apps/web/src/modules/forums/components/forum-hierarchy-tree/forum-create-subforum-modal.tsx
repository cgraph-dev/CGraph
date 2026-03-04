/**
 * Create subforum modal
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { CheckIcon } from '@heroicons/react/24/outline';
import { Modal } from './forum-admin-modal';
import { flattenTree } from './use-forum-hierarchy-admin';
import type { CreateSubforumForm } from './use-forum-hierarchy-admin';
import type { ForumNode } from './types';

interface CreateSubforumModalProps {
  tree: ForumNode[];
  selectedParent: ForumNode | null;
  onSelectParent: (node: ForumNode | null) => void;
  form: CreateSubforumForm;
  onFormChange: React.Dispatch<React.SetStateAction<CreateSubforumForm>>;
  saving: boolean;
  onClose: () => void;
  onCreate: () => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Create Subforum Modal dialog component.
 */
export function CreateSubforumModal({
  tree,
  selectedParent,
  onSelectParent,
  form,
  onFormChange,
  saving,
  onClose,
  onCreate,
}: CreateSubforumModalProps): React.ReactElement {
  return (
    <Modal onClose={onClose} title="Create Subforum">
      {/* Parent selector */}
      <label className="mb-1 block text-sm text-gray-400">Parent Forum</label>
      <select
        value={selectedParent?.id ?? ''}
        onChange={(e) => {
          const found = flattenTree(tree).find((f) => f.node.id === e.target.value);
          onSelectParent(found?.node ?? null);
        }}
        className="mb-4 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white"
      >
        <option value="">Select parent…</option>
        {flattenTree(tree).map(({ node, depth }) => (
          <option key={node.id} value={node.id}>
            {'—'.repeat(depth)} {node.name}
          </option>
        ))}
      </select>

      {/* Name */}
      <label className="mb-1 block text-sm text-gray-400">Name</label>
      <input
        value={form.name}
        onChange={(e) => onFormChange((f) => ({ ...f, name: e.target.value }))}
        placeholder="e.g. General Discussion"
        className="mb-4 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
        autoFocus
      />

      {/* Description */}
      <label className="mb-1 block text-sm text-gray-400">Description</label>
      <textarea
        value={form.description}
        onChange={(e) => onFormChange((f) => ({ ...f, description: e.target.value }))}
        placeholder="What is this subforum about?"
        rows={2}
        className="mb-4 w-full resize-none rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
      />

      {/* Type */}
      <label className="mb-1 block text-sm text-gray-400">Type</label>
      <div className="mb-4 flex gap-2">
        {(['category', 'forum'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onFormChange((f) => ({ ...f, forum_type: t }))}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
              form.forum_type === t
                ? 'bg-primary-600 text-white'
                : 'bg-white/[0.08] text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Public toggle */}
      <label className="mb-4 flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={form.is_public}
          onChange={(e) => onFormChange((f) => ({ ...f, is_public: e.target.checked }))}
          className="rounded border-white/[0.08] bg-white/[0.06] text-primary-500 focus:ring-primary-500"
        />
        Publicly visible
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={onCreate}
          disabled={saving || !form.name.trim() || !selectedParent}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? 'Creating…' : 'Create'}
        </button>
      </div>
    </Modal>
  );
}
