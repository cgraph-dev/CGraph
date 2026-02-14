/**
 * ChannelPermissionsPanel - Manage per-channel permission overwrites
 *
 * Channel permission overrides for roles and members.
 * Uses the permissions API at /api/v1/groups/:group_id/channels/:channel_id/permissions
 *
 * Orchestrator that composes sub-components from ./channel-permissions/
 *
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

import { AddOverrideForm } from './channel-permissions/AddOverrideForm';
import { OverwriteCard } from './channel-permissions/OverwriteCard';
import {
  getPermState,
  cyclePermState,
  applyPermChange,
} from './channel-permissions/permission-utils';
import type {
  PermissionOverwrite,
  RoleOption,
  ChannelPermissionsPanelProps,
} from './channel-permissions/types';

export type { ChannelPermissionsPanelProps } from './channel-permissions/types';

export function ChannelPermissionsPanel({
  groupId,
  channelId,
  channelName,
  onClose,
}: ChannelPermissionsPanelProps) {
  const [overwrites, setOverwrites] = useState<PermissionOverwrite[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'role' | 'member'>('role');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, { allow: number; deny: number }>
  >({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [permsRes, rolesRes] = await Promise.all([
        api.get(`/api/v1/groups/${groupId}/channels/${channelId}/permissions`),
        api.get(`/api/v1/groups/${groupId}/roles`),
      ]);

      const permsData = permsRes.data?.data ?? permsRes.data ?? [];
      setOverwrites(
        Array.isArray(permsData)
          ? permsData.map((o: Record<string, unknown>) => ({
              id: o.id as string,
              type: (o.type ?? 'role') as 'role' | 'member',
              roleId: (o.role_id ?? o.roleId ?? null) as string | null,
              memberId: (o.member_id ?? o.memberId ?? null) as string | null,
              roleName: (o.role_name ?? o.roleName) as string | undefined,
              memberName: (o.member_name ?? o.memberName) as string | undefined,
              allow: (o.allow ?? 0) as number,
              deny: (o.deny ?? 0) as number,
            }))
          : []
      );

      const rolesData = rolesRes.data?.data ?? rolesRes.data ?? [];
      setRoles(
        Array.isArray(rolesData)
          ? rolesData.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              name: (r.name ?? '') as string,
              color: (r.color ?? '#718096') as string,
            }))
          : []
      );
    } catch {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, [groupId, channelId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!selectedTargetId) return;
    try {
      await api.post(`/api/v1/groups/${groupId}/channels/${channelId}/permissions`, {
        type: addType,
        role_id: addType === 'role' ? selectedTargetId : undefined,
        member_id: addType === 'member' ? selectedTargetId : undefined,
        allow: 0,
        deny: 0,
      });
      setShowAddForm(false);
      setSelectedTargetId('');
      fetchData();
    } catch {
      // Handle error
    }
  };

  const handleSave = async (overwriteId: string) => {
    const changes = pendingChanges[overwriteId];
    if (!changes) return;
    try {
      setSaving(true);
      await api.put(`/api/v1/groups/${groupId}/channels/${channelId}/permissions/${overwriteId}`, {
        allow: changes.allow,
        deny: changes.deny,
      });
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[overwriteId];
        return next;
      });
      setEditingId(null);
      fetchData();
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (overwriteId: string) => {
    try {
      await api.delete(
        `/api/v1/groups/${groupId}/channels/${channelId}/permissions/${overwriteId}`
      );
      setOverwrites((prev) => prev.filter((o) => o.id !== overwriteId));
    } catch {
      // Handle error
    }
  };

  const handlePermToggle = (overwriteId: string, bit: number) => {
    const overwrite = overwrites.find((o) => o.id === overwriteId);
    if (!overwrite) return;

    const current = pendingChanges[overwriteId] ?? {
      allow: overwrite.allow,
      deny: overwrite.deny,
    };
    const state = getPermState(current.allow, current.deny, bit);
    const newState = cyclePermState(state);
    const updated = applyPermChange(current.allow, current.deny, bit, newState);

    setPendingChanges((prev) => ({ ...prev, [overwriteId]: updated }));
  };

  // Filter roles not already assigned
  const availableRoles = roles.filter(
    (r) => !overwrites.some((o) => o.type === 'role' && o.roleId === r.id)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-gray-700 bg-dark-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Channel Permissions</h2>
            <p className="text-sm text-gray-400">#{channelName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(85vh-130px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Overwrite Button */}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Override
                </motion.button>
              </div>

              {/* Add Override Form */}
              <AddOverrideForm
                show={showAddForm}
                addType={addType}
                selectedTargetId={selectedTargetId}
                availableRoles={availableRoles}
                onTypeChange={setAddType}
                onTargetChange={setSelectedTargetId}
                onAdd={handleAdd}
                onCancel={() => {
                  setShowAddForm(false);
                  setSelectedTargetId('');
                }}
              />

              {/* Overwrites List */}
              {overwrites.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No permission overrides. Channel inherits all permissions from roles.
                </div>
              ) : (
                <div className="space-y-3">
                  {overwrites.map((overwrite) => {
                    const changes = pendingChanges[overwrite.id];
                    return (
                      <OverwriteCard
                        key={overwrite.id}
                        overwrite={overwrite}
                        roles={roles}
                        isEditing={editingId === overwrite.id}
                        saving={saving}
                        pendingAllow={changes?.allow ?? overwrite.allow}
                        pendingDeny={changes?.deny ?? overwrite.deny}
                        hasPendingChanges={!!changes}
                        onToggleEdit={() =>
                          setEditingId(editingId === overwrite.id ? null : overwrite.id)
                        }
                        onDelete={() => handleDelete(overwrite.id)}
                        onPermToggle={(bit) => handlePermToggle(overwrite.id, bit)}
                        onSave={() => handleSave(overwrite.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
