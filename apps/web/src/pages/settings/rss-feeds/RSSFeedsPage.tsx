import { Rss, Info, HelpCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/layout';
import { useRSSFeeds, RECOMMENDED_APPS } from './hooks';
import FeedCard from './FeedCard';

export default function RSSFeedsPage() {
  const { feeds, copiedId, copyUrl, openUrl } = useRSSFeeds();

  return (
    <PageContainer
      title="RSS Feeds"
      subtitle="Subscribe to community content via RSS"
      maxWidth="lg"
    >
      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex gap-3 rounded-xl bg-blue-500/10 p-4"
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
        <div className="text-sm text-blue-300/80">
          <p className="font-medium text-blue-300">What is RSS?</p>
          <p className="mt-1 leading-relaxed">
            RSS (Really Simple Syndication) lets you subscribe to content updates using a feed
            reader app. New posts appear automatically in your reader — no need to check the site
            manually.
          </p>
        </div>
      </motion.div>

      {/* Recommended Apps */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-white/60">Recommended RSS Apps</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RECOMMENDED_APPS.map((app) => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg bg-dark-800/50 px-3 py-2.5 transition-colors hover:bg-dark-700/50"
            >
              <Rss className="h-4 w-4 text-orange-400" />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-white/80">{app.name}</span>
                <span className="block truncate text-[10px] text-white/30">
                  {app.platforms.join(' · ')}
                </span>
              </div>
              <ExternalLink className="h-3 w-3 shrink-0 text-white/0 transition-colors group-hover:text-white/30" />
            </a>
          ))}
        </div>
      </div>

      {/* Feeds */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-white/60">Available Feeds</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {feeds.map((feed) => (
            <FeedCard
              key={feed.id}
              feed={feed}
              isCopied={copiedId === feed.id}
              onCopy={copyUrl}
              onOpen={openUrl}
            />
          ))}
        </div>
      </div>

      {/* How to subscribe */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl bg-dark-800/30 p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white/60">How to Subscribe</h3>
        </div>
        <ol className="space-y-2 text-xs leading-relaxed text-white/40">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dark-700 text-[10px] font-bold text-white/50">
              1
            </span>
            Copy the RSS feed URL above
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dark-700 text-[10px] font-bold text-white/50">
              2
            </span>
            Open your favorite RSS reader app
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dark-700 text-[10px] font-bold text-white/50">
              3
            </span>
            Add a new subscription and paste the URL
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dark-700 text-[10px] font-bold text-white/50">
              4
            </span>
            New content will appear automatically in your reader
          </li>
        </ol>
      </motion.div>
    </PageContainer>
  );
}
