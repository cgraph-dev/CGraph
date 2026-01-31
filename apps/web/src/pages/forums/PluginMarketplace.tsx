import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PluginMarketplace');
import { usePluginStore, MarketplacePlugin, getCategoryDisplayName } from '@/stores/pluginStore';
import {
  PuzzlePieceIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

/**
 * Plugin Marketplace - Browse and install plugins for MyBB-style forums
 *
 * Features:
 * - Browse official and community plugins
 * - Filter by category
 * - Search plugins
 * - Install with one click
 * - View ratings and download counts
 */
export default function PluginMarketplace() {
  const navigate = useNavigate();
  const { forumId } = useParams<{ forumId: string }>();

  const {
    marketplacePlugins,
    marketplaceCategories,
    isLoadingMarketplace,
    installedPlugins,
    fetchMarketplace,
    fetchInstalledPlugins,
    installPlugin,
  } = usePluginStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOfficial, setShowOfficial] = useState<boolean | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketplace({
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
      official: showOfficial ?? undefined,
    });

    if (forumId) {
      fetchInstalledPlugins(forumId);
    }
  }, [selectedCategory, showOfficial, fetchMarketplace, fetchInstalledPlugins, forumId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMarketplace({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        official: showOfficial ?? undefined,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, showOfficial, fetchMarketplace]);

  const installedPluginIds = forumId
    ? (installedPlugins[forumId] || []).map((p) => p.plugin_id)
    : [];

  const handleInstall = async (plugin: MarketplacePlugin) => {
    if (!forumId) {
      toast.error('Please select a forum first');
      return;
    }

    setInstallingId(plugin.plugin_id);
    try {
      await installPlugin(forumId, plugin.plugin_id);
      toast.success(`${plugin.name} installed successfully!`);
    } catch (error: unknown) {
      logger.error('Install error:', error);
      toast.error('Failed to install plugin');
    } finally {
      setInstallingId(null);
    }
  };

  const getIconComponent = (icon: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      code: CodeBracketIcon,
      'chart-bar': ChartBarIcon,
      'shield-check': ShieldCheckIcon,
      'chat-bubble': ChatBubbleLeftRightIcon,
    };
    const IconComponent = icons[icon] || PuzzlePieceIcon;
    return <IconComponent className="h-8 w-8" />;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center gap-4">
            {forumId && (
              <button
                onClick={() => navigate(-1)}
                className="rounded-lg p-2 transition-colors hover:bg-white/10"
              >
                <ArrowLeftIcon className="h-6 w-6 text-white" />
              </button>
            )}
            <PuzzlePieceIcon className="h-12 w-12 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">Plugin Marketplace</h1>
              <p className="text-purple-100">Extend your forum with powerful plugins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-0 z-10 border-b border-dark-700 bg-dark-800">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plugins..."
                className="w-full rounded-lg border border-dark-600 bg-dark-700 py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white focus:border-purple-500"
            >
              <option value="">All Categories</option>
              {marketplaceCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryDisplayName(cat)}
                </option>
              ))}
            </select>

            {/* Official Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowOfficial(showOfficial === true ? null : true)}
                className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                  showOfficial === true
                    ? 'bg-purple-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                <CheckCircleSolid className="mr-1 inline-block h-5 w-5" />
                Official
              </button>
              <button
                onClick={() => setShowOfficial(showOfficial === false ? null : false)}
                className={`rounded-lg px-4 py-3 font-medium transition-colors ${
                  showOfficial === false
                    ? 'bg-purple-600 text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                Community
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plugin Grid */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {isLoadingMarketplace ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          </div>
        ) : marketplacePlugins.length === 0 ? (
          <div className="py-12 text-center">
            <PuzzlePieceIcon className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">No plugins found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {marketplacePlugins.map((plugin) => {
              const isInstalled = installedPluginIds.includes(plugin.plugin_id);
              const isInstalling = installingId === plugin.plugin_id;

              return (
                <div
                  key={plugin.plugin_id}
                  className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
                >
                  {/* Plugin Header */}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                        {getIconComponent(plugin.icon)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-white">
                            {plugin.name}
                          </h3>
                          {plugin.is_official && (
                            <CheckCircleSolid className="h-5 w-5 flex-shrink-0 text-purple-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">by {plugin.author}</p>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm text-gray-300">{plugin.description}</p>

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span>{plugin.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>{(plugin.download_count ?? 0).toLocaleString()}</span>
                      </div>
                      <span className="text-gray-500">v{plugin.version}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 pb-6">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-dark-700 px-3 py-1 text-xs text-gray-400">
                        {getCategoryDisplayName(plugin.category)}
                      </span>
                      <div className="flex-1" />
                      {isInstalled ? (
                        <span className="flex items-center gap-1 text-sm font-medium text-green-400">
                          <CheckCircleIcon className="h-5 w-5" />
                          Installed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleInstall(plugin)}
                          disabled={isInstalling || !forumId}
                          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isInstalling ? (
                            <span className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Installing...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <SparklesIcon className="h-4 w-4" />
                              Install
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
