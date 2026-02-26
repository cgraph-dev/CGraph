/**
 * RoleEditor Component
 *
 * Form for editing role details and permissions.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon, ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { PERMISSIONS, ROLE_COLORS } from './constants';
import { Toggle } from './toggle';
import type { RoleEditorProps } from './types';

/**
 * unknown for the groups module.
 */
/**
 * Role Editor component.
 */
export function RoleEditor({ role, isNew, onUpdate, onDelete, onSave }: RoleEditorProps) {
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
                      perm.danger ? 'border border-red-500/20 bg-red-500/5' : 'bg-dark-800'
                    }`}
                  >
                    <div>
                      <span
                        className={`font-medium ${perm.danger ? 'text-red-400' : 'text-white'}`}
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
