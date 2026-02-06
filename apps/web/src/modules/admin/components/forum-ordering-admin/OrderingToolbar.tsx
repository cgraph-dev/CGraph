/**
 * OrderingToolbar component
 * @module modules/admin/components/forum-ordering-admin
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/outline';
import type { OrderingToolbarProps } from './types';

export const OrderingToolbar = memo(function OrderingToolbar({
  hasChanges,
  canUndo,
  canRedo,
  isSaving,
  onUndo,
  onRedo,
  onSave,
  onReset,
}: OrderingToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`rounded-lg p-2 transition-colors ${
            canUndo
              ? 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
              : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`rounded-lg p-2 transition-colors ${
            canRedo
              ? 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
              : 'cursor-not-allowed text-gray-300 dark:text-gray-600'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <ArrowUturnRightIcon className="h-5 w-5" />
        </button>

        {hasChanges && (
          <span className="ml-2 text-sm text-amber-600 dark:text-amber-400">Unsaved changes</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasChanges && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-4 w-4" />
            Reset
          </button>
        )}
        <button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            hasChanges && !isSaving
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700'
          }`}
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
              />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Save Order
            </>
          )}
        </button>
      </div>
    </div>
  );
});
