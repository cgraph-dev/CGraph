/**
 * Reorder children modal
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Modal } from './forum-admin-modal';
import type { ForumNode } from './types';

interface ReorderModalProps {
  parent: ForumNode;
  onClose: () => void;
  onSave: (parentId: string, childIds: string[]) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Reorder Modal dialog component.
 */
export function ReorderModal({
  parent,
  onClose,
  onSave,
}: ReorderModalProps): React.ReactElement {
  const [items, setItems] = useState(parent.children ?? []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(
      parent.id,
      items.map((i) => i.id)
    );
    setSaving(false);
    onClose();
  };

  return (
    <Modal onClose={onClose} title={`Reorder "${parent.name}" children`}>
      <p className="mb-3 text-sm text-gray-400">Drag to reorder, or use arrows:</p>

      <div className="mb-4 max-h-64 space-y-1 overflow-y-auto">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg bg-dark-700 px-3 py-2">
            <span className="flex-1 text-sm text-white">{item.name}</span>
            <button
              disabled={idx === 0}
              onClick={() => {
                const next = [...items];
                const t = next[idx - 1]!;
                next[idx - 1] = next[idx]!;
                next[idx] = t;
                setItems(next);
              }}
              className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronUpIcon className="h-4 w-4" />
            </button>
            <button
              disabled={idx === items.length - 1}
              onClick={() => {
                const next = [...items];
                const t = next[idx]!;
                next[idx] = next[idx + 1]!;
                next[idx + 1] = t;
                setItems(next);
              }}
              className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Order'}
        </button>
      </div>
    </Modal>
  );
}
