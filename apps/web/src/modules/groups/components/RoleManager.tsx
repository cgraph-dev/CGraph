import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore, type Role } from '@/stores/groupStore';
import { useThemeStore } from '@/stores/themeStore';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

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

interface RoleManagerProps {
  groupId: string;
  className?: string;
}

// Permission definitions
const PERMISSIONS = {
  ADMINISTRATOR: {
    value: 1 << 0,
    label: 'Administrator',
    description: 'Full access to all settings',
    danger: true,
  },
  MANAGE_GROUP: {
    value: 1 << 1,
    label: 'Manage Group',
    description: 'Edit group settings and info',
  },
  MANAGE_ROLES: {
    value: 1 << 2,
    label: 'Manage Roles',
    description: 'Create and edit roles below this one',
  },
  MANAGE_CHANNELS: {
    value: 1 << 3,
    label: 'Manage Channels',
    description: 'Create, edit, and delete channels',
  },
  KICK_MEMBERS: {
    value: 1 << 4,
    label: 'Kick Members',
    description: 'Remove members from the group',
  },
  BAN_MEMBERS: { value: 1 << 5, label: 'Ban Members', description: 'Permanently ban members' },
  MANAGE_MESSAGES: {
    value: 1 << 6,
    label: 'Manage Messages',
    description: 'Delete and pin messages',
  },
  MENTION_EVERYONE: {
    value: 1 << 7,
    label: 'Mention Everyone',
    description: 'Use @everyone and @here',
  },
  MANAGE_NICKNAMES: {
    value: 1 << 8,
    label: 'Manage Nicknames',
    description: "Change other members' nicknames",
  },
  MANAGE_EMOJIS: {
    value: 1 << 9,
    label: 'Manage Emojis',
    description: 'Add and remove custom emojis',
  },
  VIEW_AUDIT_LOG: {
    value: 1 << 10,
    label: 'View Audit Log',
    description: 'Access the group audit log',
  },
  PRIORITY_SPEAKER: {
    value: 1 << 11,
    label: 'Priority Speaker',
    description: 'Be heard over others in voice',
  },
  STREAM: { value: 1 << 12, label: 'Stream', description: 'Go live in voice channels' },
  SEND_MESSAGES: {
    value: 1 << 13,
    label: 'Send Messages',
    description: 'Send messages in text channels',
  },
  EMBED_LINKS: { value: 1 << 14, label: 'Embed Links', description: 'Links will show previews' },
  ATTACH_FILES: { value: 1 << 15, label: 'Attach Files', description: 'Upload images and files' },
  ADD_REACTIONS: {
    value: 1 << 16,
    label: 'Add Reactions',
    description: 'Add reactions to messages',
  },
  CONNECT: { value: 1 << 17, label: 'Connect', description: 'Join voice channels' },
  SPEAK: { value: 1 << 18, label: 'Speak', description: 'Speak in voice channels' },
  MUTE_MEMBERS: { value: 1 << 19, label: 'Mute Members', description: 'Mute others in voice' },
  DEAFEN_MEMBERS: {
    value: 1 << 20,
    label: 'Deafen Members',
    description: 'Deafen others in voice',
  },
  MOVE_MEMBERS: {
    value: 1 << 21,
    label: 'Move Members',
    description: 'Move members between voice channels',
  },
};

const ROLE_COLORS = [
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#e11d48',
  '#7c3aed',
  '#0ea5e9',
  '#22c55e',
  '#eab308',
];

export function RoleManager({ groupId, className = '' }: RoleManagerProps) {
  const { groups } = useGroupStore();
  const { theme: _theme } = useThemeStore();

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
    // TODO: Save new order to backend
  };

  const handleCreateRole = useCallback(() => {
    const newRole: Role = {
      id: `temp-${Date.now()}`,
      name: 'New Role',
      color: ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)] ?? '#10b981',
      position: roles.length,
      permissions: PERMISSIONS.SEND_MESSAGES.value | PERMISSIONS.ADD_REACTIONS.value,
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
      // TODO: Delete from backend
    },
    [roles, selectedRole]
  );

  const handleUpdateRole = useCallback(
    (updates: Partial<Role>) => {
      if (!selectedRole) return;

      setRoles(roles.map((r) => (r.id === selectedRole.id ? { ...r, ...updates } : r)));
      setSelectedRole({ ...selectedRole, ...updates });
      // TODO: Save to backend
    },
    [roles, selectedRole]
  );

  return (
    <div className={`flex h-full ${className}`}>
      {/* Role List */}
      <div className="w-64 border-r border-gray-700/50 p-4">
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
                    : 'hover:bg-dark-700'
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

// Role Editor Component
function RoleEditor({
  role,
  isNew,
  onUpdate,
  onDelete,
  onSave,
}: {
  role: Role;
  isNew: boolean;
  onUpdate: (updates: Partial<Role>) => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  const [_showColorPicker, _setShowColorPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['general', 'permissions'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const hasPermission = (permission: number) => (role.permissions & permission) !== 0;

  const togglePermission = (permission: number) => {
    const newPermissions = hasPermission(permission)
      ? role.permissions & ~permission
      : role.permissions | permission;
    onUpdate({ permissions: newPermissions });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: role.color + '33' }}
          >
            <div className="h-6 w-6 rounded-full" style={{ backgroundColor: role.color }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{isNew ? 'Create Role' : 'Edit Role'}</h2>
            <p className="text-sm text-gray-400">{role.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!role.isDefault && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDelete}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-red-400 hover:bg-red-500/20"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSave}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white"
          >
            <CheckIcon className="h-4 w-4" />
            Save Changes
          </motion.button>
        </div>
      </div>

      {/* General Section */}
      <GlassCard variant="frosted" className="overflow-hidden">
        <button
          onClick={() => toggleSection('general')}
          className="flex w-full items-center justify-between p-4 transition-colors hover:bg-dark-700/50"
        >
          <span className="font-semibold text-white">General</span>
          {expandedSections.has('general') ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.has('general') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-700/50"
            >
              <div className="space-y-4 p-4">
                {/* Role Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Role Name</label>
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>

                {/* Role Color */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Role Color</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_COLORS.map((color) => (
                      <motion.button
                        key={color}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUpdate({ color })}
                        className={`h-8 w-8 rounded-full ${
                          role.color === color
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800'
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-dark-800 p-3">
                    <div>
                      <span className="font-medium text-white">Display separately</span>
                      <p className="text-xs text-gray-400">
                        Show members with this role in a separate group
                      </p>
                    </div>
                    <Toggle value={!role.isDefault} onChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-dark-800 p-3">
                    <div>
                      <span className="font-medium text-white">Mentionable</span>
                      <p className="text-xs text-gray-400">Anyone can @mention this role</p>
                    </div>
                    <Toggle
                      value={role.isMentionable}
                      onChange={(v) => onUpdate({ isMentionable: v })}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Permissions Section */}
      <GlassCard variant="frosted" className="overflow-hidden">
        <button
          onClick={() => toggleSection('permissions')}
          className="flex w-full items-center justify-between p-4 transition-colors hover:bg-dark-700/50"
        >
          <span className="font-semibold text-white">Permissions</span>
          {expandedSections.has('permissions') ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {expandedSections.has('permissions') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-700/50"
            >
              <div className="space-y-2 p-4">
                {Object.entries(PERMISSIONS).map(([key, perm]) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded-lg p-3 ${
                      'danger' in perm && perm.danger
                        ? 'border border-red-500/20 bg-red-500/5'
                        : 'bg-dark-800'
                    }`}
                  >
                    <div>
                      <span
                        className={`font-medium ${'danger' in perm && perm.danger ? 'text-red-400' : 'text-white'}`}
                      >
                        {perm.label}
                      </span>
                      <p className="text-xs text-gray-400">{perm.description}</p>
                    </div>
                    <Toggle
                      value={hasPermission(perm.value)}
                      onChange={() => togglePermission(perm.value)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

// Toggle Component
function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => onChange(!value)}
      className={`h-6 w-12 flex-shrink-0 rounded-full transition-colors ${
        value ? 'bg-primary-600' : 'bg-dark-600'
      }`}
    >
      <motion.div
        animate={{ x: value ? 24 : 0 }}
        className="h-6 w-6 rounded-full bg-white shadow-lg"
      />
    </motion.button>
  );
}

export default RoleManager;
