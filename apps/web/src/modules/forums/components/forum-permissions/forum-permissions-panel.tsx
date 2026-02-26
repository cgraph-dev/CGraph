/**
 * Forum Permissions Admin Panel
 *
 * Discord-style permission management for forums and boards.
 * Supports tri-state permissions (Inherit / Allow / Deny) with
 * visual indicators matching Discord's overwrite UI pattern.
 *
 * Backend endpoints:
 *   GET    /api/v1/forums/:id/permissions
 *   PUT    /api/v1/forums/:id/permissions
 *   DELETE /api/v1/forums/:id/permissions/:group_id
 *   GET    /api/v1/boards/:id/permissions
 *   PUT    /api/v1/boards/:id/permissions
 *   DELETE /api/v1/boards/:id/permissions/:group_id
 *
 * @module modules/forums/components/forum-permissions
 */

import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import type { ForumPermissionsPanelProps } from './types';
import { useForumPermissions } from './use-forum-permissions';
import { AddGroupSection } from './add-group-section';
import { PermissionOverwriteCard } from './permission-overwrite-card';
import { EmptyPermissions } from './empty-permissions';

/**
 * unknown for the forums module.
 */
/**
 * Forum Permissions Panel component.
 */
export function ForumPermissionsPanel({
  targetType,
  targetId,
  targetName,
  forumId,
  onClose,
}: ForumPermissionsPanelProps): React.ReactElement {
  const {
    overwrites,
    groups,
    loading,
    saving,
    showAdd,
    selectedGroupId,
    perms,
    categories,
    setShowAdd,
    setSelectedGroupId,
    handleSave,
    handleDelete,
    handleAdd,
    cyclePerm,
  } = useForumPermissions({ targetType, targetId, forumId });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-primary-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">
              {targetType === 'forum' ? 'Forum' : 'Board'} Permissions
            </h2>
            <p className="text-sm text-gray-400">{targetName}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Add Group */}
      <AddGroupSection
        showAdd={showAdd}
        selectedGroupId={selectedGroupId}
        groups={groups}
        overwrites={overwrites}
        onToggleAdd={setShowAdd}
        onSelectGroup={setSelectedGroupId}
        onAdd={handleAdd}
      />

      {/* Permission Overwrites */}
      {overwrites.length === 0 ? (
        <EmptyPermissions />
      ) : (
        overwrites.map((ow) => (
          <PermissionOverwriteCard
            key={ow.group_id}
            overwrite={ow}
            perms={perms}
            categories={categories}
            onDelete={handleDelete}
            onCyclePerm={cyclePerm}
          />
        ))
      )}

      {/* Save */}
      {overwrites.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </motion.div>
  );
}
