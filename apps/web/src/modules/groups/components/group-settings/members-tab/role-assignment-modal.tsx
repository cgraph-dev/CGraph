/**
 * RoleAssignmentModal - Modal for assigning roles to a group member
 * @module modules/groups/components/group-settings/members-tab
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { GroupMember, GroupRole } from './types';

interface RoleAssignmentModalProps {
  memberId: string | null;
  members: GroupMember[];
  availableRoles: GroupRole[];
  selectedRoleIds: Set<string>;
  onToggleRole: (roleId: string) => void;
  onSave: () => void;
  onClose: () => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Role Assignment Modal dialog component.
 */
export function RoleAssignmentModal({
  memberId,
  members,
  availableRoles,
  selectedRoleIds,
  onToggleRole,
  onSave,
  onClose,
}: RoleAssignmentModalProps) {
  const member = members.find((m) => m.id === memberId);
  const displayName = member?.displayName || member?.username;

  return (
    <AnimatePresence>
      {memberId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-xl border border-gray-700 bg-dark-900 p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white">Assign Roles</h3>
            <p className="text-sm text-gray-400">
              Select the roles for {displayName}
            </p>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {availableRoles
                .sort((a, b) => b.position - a.position)
                .map((role) => (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-dark-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.has(role.id)}
                      onChange={() => onToggleRole(role.id)}
                      className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600"
                    />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <span className="text-sm text-white">{role.name}</span>
                  </label>
                ))}
              {availableRoles.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">No roles configured</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Save Roles
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
