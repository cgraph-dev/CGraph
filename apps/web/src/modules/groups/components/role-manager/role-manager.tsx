/**
 * RoleManager Component
 *
 * Full-featured role management interface.
 * Features:
 * - Create/edit/delete roles
 * - Drag-and-drop reordering
 * - Permission toggles with descriptions
 * - Color picker
 * - Role hierarchy visualization
 * - Member assignment preview
 */

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Reorder } from 'motion/react';
import { ShieldCheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useGroupStore, type Role } from '@/modules/groups/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { PERMISSIONS, ROLE_COLORS } from './constants';
import { RoleEditor } from './role-editor';
import type { RoleManagerProps } from './types';
import { api } from '@/lib/api';

/**
 * unknown for the groups module.
 */
/**
 * Role Manager component.
 */
export function RoleManager({ groupId, className = '' }: RoleManagerProps) {
  const { groups } = useGroupStore();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const activeGroup = groups.find((g) => g.id === groupId);

  // Initialize roles from group
  useState(() => {
    if (activeGroup?.roles) {
      setRoles([...activeGroup.roles].sort((a, b) => b.position - a.position));
    }
  });

  const handleReorder = (newOrder: Role[]) => {
    setRoles(newOrder);
    HapticFeedback.light();
    // Persist new role order to backend
    const roleIds = newOrder.map((r) => r.id).filter((id) => !id.startsWith('temp-'));
    if (roleIds.length > 0) {
      api.post(`/api/v1/groups/${groupId}/roles/reorder`, { role_ids: roleIds }).catch(() => {});
    }
  };

  const handleCreateRole = useCallback(() => {
    const sendMessages = PERMISSIONS.SEND_MESSAGES?.value ?? 0;
    const addReactions = PERMISSIONS.ADD_REACTIONS?.value ?? 0;
    const newRole: Role = {
      id: `temp-${Date.now()}`,
      name: 'New Role',
      color: ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)] ?? '#10b981',
      position: roles.length,
      permissions: sendMessages | addReactions,
      isDefault: false,
      isMentionable: false,
    };
    setRoles([newRole, ...roles]);
    setSelectedRole(newRole);
    setIsCreating(true);
    HapticFeedback.success();
  }, [roles]);

  const handleDeleteRole = useCallback(
    (roleId: string) => {
      setRoles(roles.filter((r) => r.id !== roleId));
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
      }
      HapticFeedback.warning();
      if (!roleId.startsWith('temp-')) {
        api.delete(`/api/v1/groups/${groupId}/roles/${roleId}`).catch(() => {});
      }
    },
    [roles, selectedRole, groupId]
  );

  const handleUpdateRole = useCallback(
    (updates: Partial<Role>) => {
      if (!selectedRole) return;

      const updatedRole = { ...selectedRole, ...updates };
      setRoles(roles.map((r) => (r.id === selectedRole.id ? updatedRole : r)));
      setSelectedRole(updatedRole);

      if (selectedRole.id.startsWith('temp-')) {
        // Create new role on backend
        api.post(`/api/v1/groups/${groupId}/roles`, {
          name: updatedRole.name,
          color: updatedRole.color,
          permissions: updatedRole.permissions,
          position: updatedRole.position,
          is_mentionable: updatedRole.isMentionable,
        }).then((res) => {
          const newId = res.data?.data?.id || res.data?.id;
          if (newId) {
            setRoles((prev) => prev.map((r) => r.id === selectedRole.id ? { ...r, id: newId } : r));
            setSelectedRole((prev) => prev ? { ...prev, id: newId } : prev);
          }
          setIsCreating(false);
        }).catch(() => {});
      } else {
        // Update existing role on backend
        api.put(`/api/v1/groups/${groupId}/roles/${selectedRole.id}`, {
          name: updatedRole.name,
          color: updatedRole.color,
          permissions: updatedRole.permissions,
          position: updatedRole.position,
          is_mentionable: updatedRole.isMentionable,
        }).catch(() => {});
      }
    },
    [roles, selectedRole, groupId]
  );

  return (
    <div className={`flex h-full ${className}`}>
      {/* Role List */}
      <div className="w-64 border-r border-white/[0.06] p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <ShieldCheckIcon className="h-5 w-5 text-primary-400" />
            Roles
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCreateRole}
            className="rounded-lg bg-primary-600/20 p-1.5 text-primary-400 hover:bg-primary-600/30"
          >
            <PlusIcon className="h-4 w-4" />
          </motion.button>
        </div>

        <Reorder.Group axis="y" values={roles} onReorder={handleReorder} className="space-y-1">
          {roles.map((role) => (
            <Reorder.Item key={role.id} value={role} className="cursor-grab active:cursor-grabbing">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedRole(role);
                  setIsCreating(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  selectedRole?.id === role.id
                    ? 'border border-primary-500/50 bg-primary-600/20'
                    : 'hover:bg-white/[0.08]'
                }`}
              >
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <span className="flex-1 truncate text-left text-sm font-medium text-gray-300">
                  {role.name}
                </span>
                {role.isDefault && <span className="text-[10px] text-gray-500">DEFAULT</span>}
              </motion.button>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {roles.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">No roles yet</div>
        )}
      </div>

      {/* Role Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedRole ? (
          <RoleEditor
            role={selectedRole}
            isNew={isCreating}
            onUpdate={handleUpdateRole}
            onDelete={() => handleDeleteRole(selectedRole.id)}
            onSave={() => {
              setIsCreating(false);
              HapticFeedback.success();
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <ShieldCheckIcon className="mx-auto mb-4 h-16 w-16 text-gray-700" />
              <p className="text-gray-500">Select a role to edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleManager;
