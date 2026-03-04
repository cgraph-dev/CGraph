/**
 * OverwriteCard - Displays a single permission overwrite with expandable permission grid
 *
 * @module modules/groups/components/group-settings/channel-permissions
 */

import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { PermissionRow } from './permission-row';
import { getPermState } from './permission-utils';
import { PERMISSION_FLAGS } from './types';
import type { PermissionOverwrite, RoleOption } from './types';

interface OverwriteCardProps {
  overwrite: PermissionOverwrite;
  roles: RoleOption[];
  isEditing: boolean;
  saving: boolean;
  pendingAllow: number;
  pendingDeny: number;
  hasPendingChanges: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onPermToggle: (bit: number) => void;
  onSave: () => void;
}

function getOverwriteLabel(o: PermissionOverwrite, roles: RoleOption[]): string {
  if (o.type === 'role') {
    return o.roleName ?? roles.find((r) => r.id === o.roleId)?.name ?? 'Unknown Role';
  }
  return o.memberName ?? 'Unknown Member';
}

function getOverwriteColor(o: PermissionOverwrite, roles: RoleOption[]): string {
  if (o.type === 'role' && o.roleId) {
    return roles.find((r) => r.id === o.roleId)?.color ?? '#718096';
  }
  return '#718096';
}

/**
 * unknown for the groups module.
 */
/**
 * Overwrite Card display component.
 */
export function OverwriteCard({
  overwrite,
  roles,
  isEditing,
  saving,
  pendingAllow,
  pendingDeny,
  hasPendingChanges,
  onToggleEdit,
  onDelete,
  onPermToggle,
  onSave,
}: OverwriteCardProps) {
  const color = getOverwriteColor(overwrite, roles);
  const label = getOverwriteLabel(overwrite, roles);

  return (
    <GlassCard variant="frosted" className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {overwrite.type === 'role' ? (
            <ShieldCheckIcon className="h-5 w-5" style={{ color }} />
          ) : (
            <UserIcon className="h-5 w-5 text-gray-400" />
          )}
          <span className="font-medium" style={{ color }}>
            {label}
          </span>
          <span className="text-xs text-gray-500">({overwrite.type})</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onToggleEdit}
            className="rounded px-2 py-1 text-xs text-primary-400 hover:bg-primary-500/10"
          >
            {isEditing ? 'Collapse' : 'Edit'}
          </button>
          <button
            onClick={onDelete}
            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Permissions Grid */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 space-y-2"
          >
            <div className="grid gap-1.5">
              {PERMISSION_FLAGS.map(({ bit, label: flagLabel, description }) => {
                const state = getPermState(pendingAllow, pendingDeny, bit);
                return (
                  <PermissionRow
                    key={bit}
                    bit={bit}
                    label={flagLabel}
                    description={description}
                    state={state}
                    onToggle={onPermToggle}
                  />
                );
              })}
            </div>

            {/* Save button for this overwrite */}
            {hasPendingChanges && (
              <div className="flex justify-end pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSave}
                  disabled={saving}
                  className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
