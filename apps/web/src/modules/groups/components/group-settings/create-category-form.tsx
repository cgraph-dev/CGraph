/**
 * CreateCategoryForm - Inline form for creating a new channel category
 *
 * @module modules/groups/components/group-settings
 */

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

interface CreateCategoryFormProps {
  show: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Create Category Form component.
 */
export function CreateCategoryForm({
  show,
  name,
  onNameChange,
  onSubmit,
  onClose,
}: CreateCategoryFormProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <GlassCard variant="frosted" className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">New Category</h4>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Category name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              className="w-full rounded-lg border border-gray-700 bg-dark-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSubmit}
                disabled={!name.trim()}
                className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Create
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
