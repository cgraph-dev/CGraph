/**
 * GroupSettings Component
 *
 * Comprehensive group settings interface.
 * Features:
 * - Overview settings (name, description, icon, banner)
 * - Role management
 * - Channel management
 * - Moderation settings
 * - Invite management
 * - Danger zone (leave/delete)
 *
 * @module modules/groups/components/group-settings
 */

import { motion, AnimatePresence } from 'framer-motion';
import { RoleManager } from '../RoleManager';
import type { GroupSettingsProps } from './types';
import { useGroupSettings } from './useGroupSettings';
import { SettingsSidebar } from './SettingsSidebar';
import { OverviewTab } from './OverviewTab';
import { MembersTab } from './MembersTab';
import { InvitesTab } from './InvitesTab';
import { ChannelsTab } from './ChannelsTab';
import { NotificationsTab } from './NotificationsTab';
import { AuditLogTab } from './AuditLogTab';
import { DangerTab } from './DangerTab';
import { ConfirmModal } from './ConfirmModal';
import { SaveBar } from './SaveBar';

export function GroupSettings({ groupId, onClose: _onClose }: GroupSettingsProps) {
  const {
    activeGroup,
    activeTab,
    setActiveTab,
    isOwner,
    formData,
    handleFormChange,
    hasChanges,
    isSaving,
    handleSave,
    handleReset,
    showLeaveConfirm,
    setShowLeaveConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleLeave,
    handleDelete,
  } = useGroupSettings(groupId);

  if (!activeGroup) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Group not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-dark-900">
      {/* Sidebar */}
      <SettingsSidebar group={activeGroup} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab
              key="overview"
              group={activeGroup}
              formData={formData}
              onChange={handleFormChange}
            />
          )}

          {activeTab === 'roles' && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <RoleManager groupId={groupId} />
            </motion.div>
          )}

          {activeTab === 'members' && <MembersTab key="members" groupId={groupId} />}

          {activeTab === 'invites' && (
            <InvitesTab key="invites" groupId={groupId} groupName={activeGroup.name} />
          )}

          {activeTab === 'channels' && <ChannelsTab key="channels" groupId={groupId} />}

          {activeTab === 'notifications' && <NotificationsTab key="notifications" groupId={groupId} />}

          {activeTab === 'audit-log' && <AuditLogTab key="audit-log" groupId={groupId} />}

          {activeTab === 'danger' && (
            <DangerTab
              key="danger"
              isOwner={isOwner}
              onLeave={() => setShowLeaveConfirm(true)}
              onDelete={() => setShowDeleteConfirm(true)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Save Bar */}
      <SaveBar
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* Leave Confirmation */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <ConfirmModal
            title="Leave Group"
            message={`Are you sure you want to leave ${activeGroup.name}? You'll need an invite to rejoin.`}
            confirmLabel="Leave"
            danger
            onConfirm={handleLeave}
            onClose={() => setShowLeaveConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <ConfirmModal
            title="Delete Group"
            message={`Are you sure you want to delete ${activeGroup.name}? This action cannot be undone and all data will be lost.`}
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onClose={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default GroupSettings;
