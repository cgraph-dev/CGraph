/**
 * Forum Moderation Dashboard
 *
 * Tabbed interface: Queue, Warnings, Automod, Stats.
 *
 * @module modules/forums/components/forum-moderation/forum-mod-dashboard
 */
import { useState, useEffect } from 'react';
import { useForumStore } from '../../store/forumStore';
import ForumAutomodSettings from './forum-automod-settings';
import WarningPanel from './warning-panel';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ForumModDashboard');

interface ForumModDashboardProps {
  forumId: string;
}

type TabId = 'queue' | 'warnings' | 'automod' | 'stats';

const TABS: { id: TabId; label: string }[] = [
  { id: 'queue', label: 'Queue' },
  { id: 'warnings', label: 'Warnings' },
  { id: 'automod', label: 'Automod' },
  { id: 'stats', label: 'Stats' },
];

/**
 * Forum moderation dashboard with tabbed navigation.
 */
export default function ForumModDashboard({ forumId }: ForumModDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('queue');

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border-b dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'queue' && <ModQueueTab forumId={forumId} />}
        {activeTab === 'warnings' && <WarningPanel forumId={forumId} />}
        {activeTab === 'automod' && <ForumAutomodSettings forumId={forumId} />}
        {activeTab === 'stats' && <ModStatsTab forumId={forumId} />}
      </div>
    </div>
  );
}

// ── Queue Tab ─────────────────────────────────────────────────────────

function ModQueueTab({ forumId }: { forumId: string }) {
  const [items, setItems] = useState<ModQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchForumModQueue = useForumStore((s) => s.fetchForumModQueue);
  const takeForumModAction = useForumStore((s) => s.takeForumModAction);

  useEffect(() => {
    let cancelled = false;
    const loadQueue = async () => {
      setIsLoading(true);
      try {
        const data = await fetchForumModQueue(forumId);
        if (!cancelled) setItems(data as unknown as ModQueueItem[]);
      } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'loadQueue');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadQueue();
    return () => { cancelled = true; };
  }, [forumId, fetchForumModQueue]);

  const handleAction = async (postId: string, action: string) => {
    try {
      await takeForumModAction(forumId, postId, action as 'approve' | 'remove' | 'hide');
      setItems((prev) => prev.filter((i) => i.id !== postId));
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'handleAction');
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading queue…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg">No items in moderation queue</p>
        <p className="text-sm mt-1">All clear!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between rounded-lg border p-4 dark:border-gray-700"
        >
          <div className="flex-1">
            <p className="text-sm text-gray-900 dark:text-white">{item.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              Reason: {item.flag_reason || 'N/A'} · {item.flagged_at}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => handleAction(item.id, 'approve')}
              className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(item.id, 'remove')}
              className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────

function ModStatsTab({ forumId }: { forumId: string }) {
  const [stats, setStats] = useState<{ pending_count: number; resolved_count: number } | null>(
    null
  );
  const fetchForumModStats = useForumStore((s) => s.fetchForumModStats);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchForumModStats(forumId);
        if (!cancelled) setStats(data);
      } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'loadStats');
      }
    })();
    return () => { cancelled = true; };
  }, [forumId, fetchForumModStats]);

  if (!stats) {
    return <div className="p-4 text-sm text-gray-500">Loading stats…</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Pending Items" value={stats.pending_count} color="amber" />
      <StatCard label="Resolved Items" value={stats.resolved_count} color="green" />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'amber' | 'green' | 'red' | 'blue';
}) {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────

interface ModQueueItem {
  id: string;
  content: string;
  author_id: string;
  flag_reason: string | null;
  flagged_at: string | null;
  moderation_status: string | null;
}
