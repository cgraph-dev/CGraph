/**
 * HelpText component
 * @module modules/admin/components/forum-ordering-admin
 */

export function HelpText() {
  return (
    <div className="mt-6 space-y-1 text-xs text-gray-500 dark:text-gray-400">
      <p>💡 Drag items to reorder, or use the arrow buttons</p>
      <p>⌨️ Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+S (Save)</p>
    </div>
  );
}
