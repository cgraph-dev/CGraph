/**
 * TreeControls component
 * @module modules/forums/components/forum-hierarchy-tree
 */

interface TreeControlsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function TreeControls({ onExpandAll, onCollapseAll }: TreeControlsProps) {
  return (
    <div className="mb-2 flex items-center justify-between px-2 py-1 text-xs text-gray-500">
      <span>Forums</span>
      <div className="flex items-center gap-2">
        <button
          onClick={onExpandAll}
          className="hover:text-gray-700 dark:hover:text-gray-300"
          title="Expand all"
        >
          Expand
        </button>
        <span>|</span>
        <button
          onClick={onCollapseAll}
          className="hover:text-gray-700 dark:hover:text-gray-300"
          title="Collapse all"
        >
          Collapse
        </button>
      </div>
    </div>
  );
}
