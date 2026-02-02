import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Cog6ToothIcon,
  PhotoIcon,
  TrashIcon,
  ShieldCheckIcon,
  BellIcon,
  LinkIcon,
  UsersIcon,
  HashtagIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useGroupStore, type Group } from '@/stores/groupStore';
import { RoleManager } from './RoleManager';
import { InviteModal } from './InviteModal';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { createLogger } from '@/lib/logger';

const logger = createLogger('GroupSettings');

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
 */

interface GroupSettingsProps {
  groupId: string;
  onClose?: () => void;
}

const settingsTabs = [
  { id: 'overview', label: 'Overview', icon: Cog6ToothIcon },
  { id: 'roles', label: 'Roles', icon: ShieldCheckIcon },
  { id: 'members', label: 'Members', icon: UsersIcon },
  { id: 'invites', label: 'Invites', icon: LinkIcon },
  { id: 'channels', label: 'Channels', icon: HashtagIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'danger', label: 'Danger Zone', icon: ExclamationTriangleIcon },
] as const;

type TabId = (typeof settingsTabs)[number]['id'];

export function GroupSettings({ groupId, onClose: _onClose }: GroupSettingsProps) {
  const navigate = useNavigate();
  const { groups, leaveGroup, updateGroup, deleteGroup } = useGroupStore();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const activeGroup = groups.find((g) => g.id === groupId);
  const isOwner = activeGroup?.ownerId === 'current-user-id'; // TODO: Get from auth

  const [formData, setFormData] = useState({
    name: activeGroup?.name || '',
    description: activeGroup?.description || '',
    isPublic: activeGroup?.isPublic || false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateGroup(groupId, {
        name: formData.name,
        description: formData.description || null,
        isPublic: formData.isPublic,
      });
      setHasChanges(false);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to save:', error);
      HapticFeedback.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(groupId);
      HapticFeedback.warning();
      navigate('/groups');
    } catch (error) {
      logger.error('Failed to leave group:', error);
      HapticFeedback.error();
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup(groupId);
      HapticFeedback.warning();
      navigate('/groups');
    } catch (error) {
      logger.error('Failed to delete group:', error);
      HapticFeedback.error();
    }
  };

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
      <div className="w-56 border-r border-gray-700/50 bg-dark-800/50 p-4">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-700/50 pb-4">
          <div className="h-10 w-10 overflow-hidden rounded-xl">
            {activeGroup.iconUrl ? (
              <img
                src={activeGroup.iconUrl}
                alt={activeGroup.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="font-bold text-white">
                  {activeGroup.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-white">{activeGroup.name}</h3>
            <p className="text-xs text-gray-400">Group Settings</p>
          </div>
        </div>

        <nav className="space-y-1">
          {settingsTabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600/20 text-primary-400'
                  : tab.id === 'danger'
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab
              key="overview"
              group={activeGroup}
              formData={formData}
              onChange={(data) => {
                setFormData(data);
                setHasChanges(true);
              }}
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

          {activeTab === 'notifications' && <NotificationsTab key="notifications" />}

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
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 border-t border-gray-700/50 bg-dark-900/90 p-4 backdrop-blur-sm"
          >
            <div className="mx-auto flex max-w-2xl items-center justify-between">
              <p className="text-sm text-gray-400">You have unsaved changes</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFormData({
                      name: activeGroup?.name || '',
                      description: activeGroup?.description || '',
                      isPublic: activeGroup?.isPublic || false,
                    });
                    setHasChanges(false);
                  }}
                  className="rounded-lg bg-dark-700 px-4 py-2 text-gray-300 hover:bg-dark-600"
                >
                  Reset
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

// Overview Tab
function OverviewTab({
  group,
  formData,
  onChange,
}: {
  group: Group;
  formData: { name: string; description: string; isPublic: boolean };
  onChange: (data: typeof formData) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Overview</h2>
        <p className="text-gray-400">Configure your group's basic settings</p>
      </div>

      {/* Banner & Icon */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 font-semibold text-white">Group Appearance</h3>

        {/* Banner */}
        <div className="relative mb-4 h-32 overflow-hidden rounded-xl bg-dark-700">
          {group.bannerUrl ? (
            <img src={group.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PhotoIcon className="h-12 w-12 text-gray-600" />
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute bottom-2 right-2 flex items-center gap-2 rounded-lg bg-dark-900/80 px-3 py-1.5 text-sm text-white"
          >
            <PhotoIcon className="h-4 w-4" />
            Change Banner
          </motion.button>
        </div>

        {/* Icon */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-dark-700">
            {group.iconUrl ? (
              <img src={group.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-2xl font-bold text-white">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-primary-600/20 px-4 py-2 text-sm font-medium text-primary-400"
            >
              Upload Icon
            </motion.button>
            <p className="mt-1 text-xs text-gray-500">Recommended: 512x512</p>
          </div>
        </div>
      </GlassCard>

      {/* Basic Info */}
      <GlassCard variant="frosted" className="space-y-4 p-6">
        <h3 className="font-semibold text-white">Basic Information</h3>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Group Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-700 bg-dark-800 px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-dark-800 p-4">
          <div>
            <span className="font-medium text-white">Public Group</span>
            <p className="text-xs text-gray-400">Anyone can discover and join</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange({ ...formData, isPublic: !formData.isPublic })}
            className={`h-6 w-12 rounded-full transition-colors ${
              formData.isPublic ? 'bg-primary-600' : 'bg-dark-600'
            }`}
          >
            <motion.div
              animate={{ x: formData.isPublic ? 24 : 0 }}
              className="h-6 w-6 rounded-full bg-white shadow-lg"
            />
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Placeholder tabs
function MembersTab({ groupId: _groupId }: { groupId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="mb-4 text-2xl font-bold text-white">Members</h2>
      <p className="text-gray-400">Manage group members and their roles.</p>
      {/* TODO: Implement member management */}
    </motion.div>
  );
}

function InvitesTab({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Invites</h2>
          <p className="text-gray-400">Manage invitation links for your group.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white"
        >
          Create Invite
        </motion.button>
      </div>

      <AnimatePresence>
        {showModal && (
          <InviteModal
            groupId={groupId}
            groupName={groupName}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChannelsTab({ groupId: _groupId }: { groupId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="mb-4 text-2xl font-bold text-white">Channels</h2>
      <p className="text-gray-400">Manage channels and categories.</p>
      {/* TODO: Implement channel management */}
    </motion.div>
  );
}

function NotificationsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="mb-4 text-2xl font-bold text-white">Notifications</h2>
      <p className="text-gray-400">Configure notification preferences for this group.</p>
      {/* TODO: Implement notification settings */}
    </motion.div>
  );
}

function DangerTab({
  isOwner,
  onLeave,
  onDelete,
}: {
  isOwner: boolean;
  onLeave: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl"
    >
      <h2 className="mb-2 text-2xl font-bold text-red-400">Danger Zone</h2>
      <p className="mb-6 text-gray-400">
        These actions are irreversible. Please proceed with caution.
      </p>

      <div className="space-y-4">
        <GlassCard variant="frosted" className="border border-red-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Leave Group</h3>
              <p className="text-sm text-gray-400">You will need an invite to rejoin.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLeave}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-red-400 hover:bg-red-500/20"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Leave
            </motion.button>
          </div>
        </GlassCard>

        {isOwner && (
          <GlassCard variant="frosted" className="border border-red-500/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Delete Group</h3>
                <p className="text-sm text-gray-400">
                  Permanently delete this group and all its data.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDelete}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
              >
                <TrashIcon className="h-5 w-5" />
                Delete
              </motion.button>
            </div>
          </GlassCard>
        )}
      </div>
    </motion.div>
  );
}

// Confirm Modal
function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-gray-700 bg-dark-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`text-xl font-bold ${danger ? 'text-red-400' : 'text-white'} mb-2`}>
          {title}
        </h2>
        <p className="mb-6 text-gray-400">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-dark-700 py-3 text-gray-300 transition-colors hover:bg-dark-600"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 font-semibold ${
              danger ? 'bg-red-600 text-white' : 'bg-primary-600 text-white'
            }`}
          >
            {confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default GroupSettings;
