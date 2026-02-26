/**
 * AuditLogTab component - Group audit log viewer
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  HashtagIcon,
  ShieldCheckIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  LinkIcon,
  FaceSmileIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { entranceVariants } from '@/lib/animation-presets';
import { api } from '@/lib/api';

interface AuditLogEntry {
  id: string;
  action: string;
  actor_id: string;
  target_user_id: string | null;
  changes: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
  actor_username?: string;
  target_username?: string;
}

interface AuditLogTabProps {
  groupId: string;
}

const ACTION_CATEGORIES: Record<string, { label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }> = {
  group_update: { label: 'Group Updated', icon: Cog6ToothIcon, color: 'text-blue-400' },
  group_delete: { label: 'Group Deleted', icon: Cog6ToothIcon, color: 'text-red-400' },
  channel_create: { label: 'Channel Created', icon: HashtagIcon, color: 'text-green-400' },
  channel_update: { label: 'Channel Updated', icon: HashtagIcon, color: 'text-blue-400' },
  channel_delete: { label: 'Channel Deleted', icon: HashtagIcon, color: 'text-red-400' },
  member_kick: { label: 'Member Kicked', icon: UsersIcon, color: 'text-orange-400' },
  member_ban: { label: 'Member Banned', icon: UsersIcon, color: 'text-red-400' },
  member_unban: { label: 'Member Unbanned', icon: UsersIcon, color: 'text-green-400' },
  member_mute: { label: 'Member Muted', icon: UsersIcon, color: 'text-yellow-400' },
  member_unmute: { label: 'Member Unmuted', icon: UsersIcon, color: 'text-green-400' },
  member_role_update: { label: 'Role Changed', icon: ShieldCheckIcon, color: 'text-purple-400' },
  role_create: { label: 'Role Created', icon: ShieldCheckIcon, color: 'text-green-400' },
  role_update: { label: 'Role Updated', icon: ShieldCheckIcon, color: 'text-blue-400' },
  role_delete: { label: 'Role Deleted', icon: ShieldCheckIcon, color: 'text-red-400' },
  message_delete: { label: 'Message Deleted', icon: ChatBubbleLeftIcon, color: 'text-red-400' },
  message_pin: { label: 'Message Pinned', icon: ChatBubbleLeftIcon, color: 'text-yellow-400' },
  message_unpin: { label: 'Message Unpinned', icon: ChatBubbleLeftIcon, color: 'text-gray-400' },
  invite_create: { label: 'Invite Created', icon: LinkIcon, color: 'text-green-400' },
  invite_delete: { label: 'Invite Deleted', icon: LinkIcon, color: 'text-red-400' },
  emoji_create: { label: 'Emoji Added', icon: FaceSmileIcon, color: 'text-green-400' },
  emoji_delete: { label: 'Emoji Removed', icon: FaceSmileIcon, color: 'text-red-400' },
};

const FILTER_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'channel', label: 'Channels' },
  { value: 'member', label: 'Members' },
  { value: 'role', label: 'Roles' },
  { value: 'message', label: 'Messages' },
  { value: 'invite', label: 'Invites' },
  { value: 'emoji', label: 'Emojis' },
  { value: 'group', label: 'Group' },
];

const PER_PAGE = 25;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderChanges(changes: Record<string, unknown> | null) {
  if (!changes || Object.keys(changes).length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {Object.entries(changes).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-mono text-gray-400">{key}:</span>
          <span className="text-gray-300">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * unknown for the groups module.
 */
/**
 * Audit Log Tab component.
 */
export function AuditLogTab({ groupId }: AuditLogTabProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchAuditLog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/groups/${groupId}/audit-log`, {
        params: { page, per_page: PER_PAGE },
      });
      setEntries(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, page]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const filteredEntries = entries.filter((entry) => {
    if (filterCategory && !entry.action.startsWith(filterCategory)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const actionInfo = ACTION_CATEGORIES[entry.action];
      const label = actionInfo?.label.toLowerCase() || '';
      const actor = (entry.actor_username || entry.actor_id || '').toLowerCase();
      const target = (entry.target_username || entry.target_user_id || '').toLowerCase();
      return label.includes(q) || actor.includes(q) || target.includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <motion.div {...entranceVariants.fadeUp} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Audit Log</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-lg p-2 transition-colors ${
              showFilters || filterCategory
                ? 'bg-primary-600/20 text-primary-400'
                : 'text-gray-400 hover:bg-dark-700 hover:text-white'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
          <button
            onClick={fetchAuditLog}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <GlassCard className="space-y-3 p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search audit log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-dark-800 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-primary-500"
          />
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-2 overflow-hidden"
            >
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterCategory(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filterCategory === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Entries */}
      <GlassCard className="divide-y divide-gray-700/50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            {searchQuery || filterCategory ? 'No matching entries found' : 'No audit log entries yet'}
          </div>
        ) : (
          filteredEntries.map((entry, index) => {
            const actionInfo = ACTION_CATEGORIES[entry.action] || {
              label: entry.action,
              icon: Cog6ToothIcon,
              color: 'text-gray-400',
            };
            const Icon = actionInfo.icon;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-start gap-3 p-4"
              >
                <div className={`mt-0.5 rounded-lg bg-dark-700 p-2 ${actionInfo.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-white">
                      {entry.actor_username || entry.actor_id?.slice(0, 8)}
                    </span>
                    <span className={`text-sm ${actionInfo.color}`}>{actionInfo.label}</span>
                    {entry.target_user_id && (
                      <>
                        <span className="text-xs text-gray-500">→</span>
                        <span className="text-sm text-gray-300">
                          {entry.target_username || entry.target_user_id.slice(0, 8)}
                        </span>
                      </>
                    )}
                  </div>
                  {entry.reason && (
                    <p className="mt-1 text-xs text-gray-400">Reason: {entry.reason}</p>
                  )}
                  {renderChanges(entry.changes)}
                </div>
                <span className="shrink-0 text-xs text-gray-500">{formatDate(entry.created_at)}</span>
              </motion.div>
            );
          })
        )}
      </GlassCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages} ({total} entries)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white disabled:opacity-30"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
