/**
 * RSS Feed Configuration Panel
 *
 * Admin config for enabling/disabling RSS per board,
 * with feed URL display and format preferences.
 *
 * @version 1.0.0
 * @module components/forums/rss-feed/RssFeedConfig
 */

import { useState, useEffect, useCallback, memo } from 'react';
import {
  RssIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useRssConfigStore } from '../../store/forumStore.rss';
import type { BoardRssConfig } from '../../store/forumStore.rss';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RssFeedConfigProps {
  forumId: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const CopyButton = memo(function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-300"
      title="Copy feed URL"
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-green-500" />
      ) : (
        <ClipboardDocumentIcon className="h-4 w-4" />
      )}
    </button>
  );
});

const BoardRow = memo(function BoardRow({
  board,
  feedFormat,
  onToggle,
}: {
  board: BoardRssConfig;
  feedFormat: 'rss' | 'atom';
  onToggle: (boardId: string, enabled: boolean) => void;
}) {
  const feedUrl = feedFormat === 'atom' ? board.atomUrl : board.feedUrl;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <RssIcon className="h-4 w-4 text-orange-500" />
          <span className="font-medium text-gray-900 dark:text-white">{board.boardName}</span>
        </div>
        {board.rssEnabled && feedUrl && (
          <div className="mt-1 flex items-center gap-1">
            <code className="max-w-xs truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-400">
              {feedUrl}
            </code>
            <CopyButton text={feedUrl} />
          </div>
        )}
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={board.rssEnabled}
          onChange={(e) => onToggle(board.boardId, e.target.checked)}
          className="peer sr-only"
        />
        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-600" />
      </label>
    </div>
  );
});

// ─── Main Component ──────────────────────────────────────────────────────────

export const RssFeedConfig = memo(function RssFeedConfig({ forumId }: RssFeedConfigProps) {
  const { config, loading, error, fetchRssConfig, updateBoardRss, toggleGlobalRss } =
    useRssConfigStore();

  const [feedFormat, setFeedFormatLocal] = useState<'rss' | 'atom'>('rss');
  const [itemsPerFeed, setItemsLocal] = useState(20);

  const { setFeedFormat, setItemsPerFeed } = useRssConfigStore();

  useEffect(() => {
    fetchRssConfig(forumId);
  }, [forumId, fetchRssConfig]);

  useEffect(() => {
    if (config) {
      setFeedFormatLocal(config.feedFormat);
      setItemsLocal(config.itemsPerFeed);
    }
  }, [config]);

  const handleBoardToggle = useCallback(
    async (boardId: string, enabled: boolean) => {
      try {
        await updateBoardRss(forumId, boardId, enabled);
      } catch {
        // toast error
      }
    },
    [forumId, updateBoardRss]
  );

  const handleGlobalToggle = useCallback(
    async (enabled: boolean) => {
      try {
        await toggleGlobalRss(forumId, enabled);
      } catch {
        // toast error
      }
    },
    [forumId, toggleGlobalRss]
  );

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">RSS Feed Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure RSS and Atom feeds for your forum boards
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Global toggle */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <div className="flex items-center gap-3">
          <GlobeAltIcon className="h-5 w-5 text-orange-500" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Forum-wide RSS Feed</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enable the global forum activity feed
            </p>
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={config?.globalEnabled ?? true}
            onChange={(e) => handleGlobalToggle(e.target.checked)}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-600" />
        </label>
      </div>

      {/* Settings */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <Cog6ToothIcon className="h-5 w-5 text-gray-400" />

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Format:</label>
          <select
            value={feedFormat}
            onChange={(e) => {
               
              const v = e.target.value as 'rss' | 'atom';
              setFeedFormatLocal(v);
              setFeedFormat(v);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white"
          >
            <option value="rss">RSS 2.0</option>
            <option value="atom">Atom 1.0</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Items per feed:
          </label>
          <select
            value={itemsPerFeed}
            onChange={(e) => {
              const v = Number(e.target.value);
              setItemsLocal(v);
              setItemsPerFeed(v);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Board list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Per-Board RSS Feeds
        </h3>
        {(config?.boards ?? []).map((board) => (
          <BoardRow
            key={board.boardId}
            board={board}
            feedFormat={feedFormat}
            onToggle={handleBoardToggle}
          />
        ))}
        {(config?.boards ?? []).length === 0 && (
          <p className="py-4 text-center text-sm text-gray-400">No boards found</p>
        )}
      </div>
    </div>
  );
});

export default RssFeedConfig;
