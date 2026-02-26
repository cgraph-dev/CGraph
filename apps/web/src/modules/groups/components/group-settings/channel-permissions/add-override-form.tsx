/**
 * AddOverrideForm - Form to add a new permission override for a role or member
 *
 * @module modules/groups/components/group-settings/channel-permissions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { RoleOption } from './types';

interface AddOverrideFormProps {
  show: boolean;
  addType: 'role' | 'member';
  selectedTargetId: string;
  availableRoles: RoleOption[];
  onTypeChange: (type: 'role' | 'member') => void;
  onTargetChange: (id: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Add Override Form component.
 */
export function AddOverrideForm({
  show,
  addType,
  selectedTargetId,
  availableRoles,
  onTypeChange,
  onTargetChange,
  onAdd,
  onCancel,
}: AddOverrideFormProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <GlassCard variant="frosted" className="space-y-3 p-4">
            <div className="flex gap-3">
              <button
                onClick={() => onTypeChange('role')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                  addType === 'role'
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500'
                    : 'text-gray-400 border border-gray-700'
                }`}
              >
                <ShieldCheckIcon className="h-4 w-4" />
                Role
              </button>
              <button
                onClick={() => onTypeChange('member')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                  addType === 'member'
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500'
                    : 'text-gray-400 border border-gray-700'
                }`}
              >
                <UserIcon className="h-4 w-4" />
                Member
              </button>
            </div>

            {addType === 'role' ? (
              <select
                value={selectedTargetId}
                onChange={(e) => onTargetChange(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-dark-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="">Select a role...</option>
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter member ID..."
                value={selectedTargetId}
                onChange={(e) => onTargetChange(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-dark-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onCancel}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAdd}
                disabled={!selectedTargetId}
                className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Add
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
