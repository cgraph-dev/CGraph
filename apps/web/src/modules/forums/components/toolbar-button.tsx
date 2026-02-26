/** @module BBCode toolbar button sub-component for QuickReply. */

import type { ToolbarButtonProps } from './quick-reply-types';

/**
 * unknown for the forums module.
 */
/**
 * Toolbar Button component.
 */
export function ToolbarButton({ title, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
    >
      {children}
    </button>
  );
}
