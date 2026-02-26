/**
 * useKeyboardShortcuts hook
 * @module modules/admin/components/forum-ordering-admin
 */

import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
}

/**
 * unknown for the admin module.
 */
/**
 * Hook for managing keyboard shortcuts.
 */
export function useKeyboardShortcuts({ onUndo, onRedo, onSave }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        onRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onSave]);
}
