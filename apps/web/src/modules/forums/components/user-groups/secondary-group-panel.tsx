/**
 * Secondary Group Panel
 *
 * List secondary groups with member counts, assign to user, view/remove members.
 * Shows OR-logic stacking and expiring-soon badges.
 *
 * @module modules/forums/components/user-groups/secondary-group-panel
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  useUserGroupsStore,
  type SecondaryGroupMember,
  type AssignSecondaryData,
} from '../../store/forumStore.userGroups';

interface SecondaryGroupPanelProps {
  forumId: string;
}

/** Description. */
/** Secondary Group Panel component. */
export function SecondaryGroupPanel({ forumId }: SecondaryGroupPanelProps) {
  const {
    groups,
    secondaryMembers,
    isLoadingMembers,
    fetchGroups,
    fetchMembers,
    assignSecondaryGroup,
    removeSecondaryGroup,
  } = useUserGroupsStore();

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);

  useEffect(() => {
    if (groups.length === 0) fetchGroups(forumId);
  }, [forumId, groups.length, fetchGroups]);

  const handleExpand = useCallback(
    (groupId: string) => {
      if (expandedGroupId === groupId) {
        setExpandedGroupId(null);
      } else {
        setExpandedGroupId(groupId);
        fetchMembers(forumId, groupId);
      }
    },
    [expandedGroupId, forumId, fetchMembers]
  );

  const handleRemove = useCallback(
    async (membershipId: string) => {
      if (!window.confirm('Remove this secondary group assignment?')) return;
      await removeSecondaryGroup(forumId, membershipId);
    },
    [forumId, removeSecondaryGroup]
  );

  const isExpiringSoon = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7 days
  };

  const membersByGroup = secondaryMembers.reduce<Record<string, SecondaryGroupMember[]>>(
    (acc, m) => {
      if (!acc[m.groupId]) acc[m.groupId] = [];
      acc[m.groupId]!.push(m);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="h-6 w-6 text-purple-500" />
          <h2 className="text-xl font-bold">Secondary Groups</h2>
        </div>
        <button
          onClick={() => setShowAssignForm(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
        >
          <PlusIcon className="h-4 w-4" />
          Assign to User
        </button>
      </div>

      {/* OR-logic explanation */}
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-3">
        <p className="text-xs text-gray-400">
          <strong className="text-gray-300">OR-logic stacking:</strong> Users with multiple
          secondary groups inherit the <em>union</em> of all group permissions. Any
          &quot;allow&quot; from any group grants access.
        </p>
      </div>

      {/* Group list */}
      <div className="space-y-2">
        {groups.map((group) => {
          const members = membersByGroup[group.id] || [];
          const isExpanded = expandedGroupId === group.id;
          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04]"
            >
              {/* Group header */}
              <button
                onClick={() => handleExpand(group.id)}
                className="hover:bg-gray-750 flex w-full items-center justify-between p-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: group.color || '#6b7280' }}
                  />
                  <span className="font-medium text-white">{group.name}</span>
                  <span className="text-sm text-gray-400">
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                  </span>
                  {group.type === 'system' && (
                    <span className="rounded bg-blue-900 px-1.5 py-0.5 text-xs text-blue-300">
                      System
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Expanded: member list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/[0.08]"
                  >
                    {isLoadingMembers ? (
                      <div className="p-4 text-center">
                        <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                      </div>
                    ) : members.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-400">
                        No secondary group members.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between px-4 py-3"
                          >
                            <div>
                              <span className="text-sm text-white">
                                {member.displayName || member.username || member.userId}
                              </span>
                              {member.expiresAt && (
                                <span
                                  className={`ml-2 inline-flex items-center gap-1 text-xs ${
                                    isExpiringSoon(member.expiresAt)
                                      ? 'text-amber-400'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {isExpiringSoon(member.expiresAt) ? (
                                    <ExclamationTriangleIcon className="h-3 w-3" />
                                  ) : (
                                    <ClockIcon className="h-3 w-3" />
                                  )}
                                  Expires {new Date(member.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                              {member.reason && (
                                <span className="ml-2 text-xs text-gray-500">
                                  — {member.reason}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemove(member.id)}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:text-red-400"
                              title="Remove"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="py-8 text-center text-gray-400">
          No groups available. Create groups first.
        </div>
      )}

      {/* Assign Form Modal */}
      {showAssignForm && (
        <AssignForm
          forumId={forumId}
          groups={groups}
          onAssign={async (data) => {
            await assignSecondaryGroup(forumId, data);
            setShowAssignForm(false);
          }}
          onClose={() => setShowAssignForm(false)}
        />
      )}
    </div>
  );
}

// ── Assign Form ──────────────────────────────────────────────────────────

interface AssignFormProps {
  forumId: string;
  groups: { id: string; name: string; color: string | null }[];
  onAssign: (data: AssignSecondaryData) => Promise<void>;
  onClose: () => void;
}

function AssignForm({ groups, onAssign, onClose }: AssignFormProps) {
  const [userId, setUserId] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [expiresAt, setExpiresAt] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !groupId) return;
    setSaving(true);
    try {
      await onAssign({
        userId: userId.trim(),
        groupId,
        expiresAt: expiresAt || null,
        reason: reason.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-md rounded-xl border border-white/[0.08] bg-white/[0.04] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold">Assign Secondary Group</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              User ID / Username
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
              placeholder="Enter user ID or username"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Group</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Expires At (optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
              placeholder="e.g., Premium subscription"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !userId.trim()}
              className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default SecondaryGroupPanel;
