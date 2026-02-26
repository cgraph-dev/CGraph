/** FeedCard — displays an RSS feed entry with copy-link and external-link actions. */
import { Copy, Check, ExternalLink, Rss, MessageSquare, Megaphone, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RSSFeed } from './types';

const ICON_MAP = {
  rss: Rss,
  'message-square': MessageSquare,
  megaphone: Megaphone,
  hash: Hash,
} as const;

const COLOR_MAP: Record<string, string> = {
  orange: 'bg-orange-500/20 text-orange-400',
  blue: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  emerald: 'bg-emerald-500/20 text-emerald-400',
};

/**
 * Feed Card display component.
 */
export default function FeedCard({
  feed,
  isCopied,
  onCopy,
  onOpen,
}: {
  feed: RSSFeed;
  isCopied: boolean;
  onCopy: (feed: RSSFeed) => void;
  onOpen: (feed: RSSFeed) => void;
}) {
  const Icon = ICON_MAP[feed.icon] || Rss;
  const colorClass = COLOR_MAP[feed.color] || COLOR_MAP.orange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-dark-800/50 p-5"
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{feed.name}</h3>
          <p className="text-xs text-white/40">{feed.description}</p>
        </div>
      </div>

      {/* URL bar */}
      <div className="mb-3 flex items-center rounded-lg bg-dark-900/60 p-2.5">
        <code className="flex-1 truncate text-xs text-white/50">{feed.url}</code>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onCopy(feed)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors ${
            isCopied
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-dark-700 text-white/60 hover:text-white'
          }`}
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy URL
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => onOpen(feed)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-dark-700 py-2 text-xs font-medium text-white/60 transition-colors hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Feed
        </button>
      </div>
    </motion.div>
  );
}
