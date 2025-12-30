import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray, ensureObject } from '@/lib/apiUtils';

// =============================================================================
// Types - Plugin System
// =============================================================================

export interface MarketplacePlugin {
  plugin_id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  author_url: string | null;
  category: string;
  icon: string;
  download_count: number;
  rating: number;
  is_official: boolean;
}

export interface InstalledPlugin {
  id: string;
  plugin_id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  author_url: string | null;
  is_active: boolean;
  is_core: boolean;
  settings: Record<string, unknown>;
  hooks: string[];
  css_files: string[];
  js_files: string[];
  position: number;
  installed_at: string;
  forum_id: string;
}

interface PluginState {
  // Marketplace
  marketplacePlugins: MarketplacePlugin[];
  marketplaceCategories: string[];
  isLoadingMarketplace: boolean;
  
  // Installed plugins (per forum)
  installedPlugins: Record<string, InstalledPlugin[]>;
  isLoadingInstalled: boolean;
  
  // Actions - Marketplace
  fetchMarketplace: (options?: { category?: string; search?: string; official?: boolean }) => Promise<void>;
  getMarketplacePlugin: (pluginId: string) => Promise<MarketplacePlugin>;
  
  // Actions - Installed
  fetchInstalledPlugins: (forumId: string) => Promise<void>;
  installPlugin: (forumId: string, pluginId: string, settings?: Record<string, unknown>) => Promise<InstalledPlugin>;
  uninstallPlugin: (forumId: string, pluginInstanceId: string) => Promise<void>;
  togglePlugin: (forumId: string, pluginInstanceId: string) => Promise<InstalledPlugin>;
  updatePluginSettings: (forumId: string, pluginInstanceId: string, settings: Record<string, unknown>) => Promise<InstalledPlugin>;
}

// =============================================================================
// Store
// =============================================================================

export const usePluginStore = create<PluginState>((set, _get) => ({
  marketplacePlugins: [],
  marketplaceCategories: [],
  isLoadingMarketplace: false,
  installedPlugins: {},
  isLoadingInstalled: false,

  // =========================================================================
  // Marketplace Actions
  // =========================================================================

  fetchMarketplace: async (options) => {
    set({ isLoadingMarketplace: true });
    try {
      const params = new URLSearchParams();
      if (options?.category) params.append('category', options.category);
      if (options?.search) params.append('search', options.search);
      if (options?.official !== undefined) params.append('official', String(options.official));
      
      const url = `/api/v1/plugins/marketplace${params.toString() ? `?${params}` : ''}`;
      const response = await api.get(url);
      
      const plugins = ensureArray<MarketplacePlugin>(response.data, 'data');
      const categories = response.data.meta?.categories || [];
      
      set({
        marketplacePlugins: plugins,
        marketplaceCategories: categories,
        isLoadingMarketplace: false,
      });
    } catch (error) {
      console.error('[pluginStore] fetchMarketplace error:', error);
      set({ isLoadingMarketplace: false });
      throw error;
    }
  },

  getMarketplacePlugin: async (pluginId) => {
    const response = await api.get(`/api/v1/plugins/marketplace/${pluginId}`);
    return ensureObject<MarketplacePlugin>(response.data, 'plugin') as MarketplacePlugin;
  },

  // =========================================================================
  // Installed Plugin Actions
  // =========================================================================

  fetchInstalledPlugins: async (forumId) => {
    set({ isLoadingInstalled: true });
    try {
      const response = await api.get(`/api/v1/forums/${forumId}/plugins`);
      const plugins = ensureArray<InstalledPlugin>(response.data, 'data');
      
      set((state) => ({
        installedPlugins: {
          ...state.installedPlugins,
          [forumId]: plugins,
        },
        isLoadingInstalled: false,
      }));
    } catch (error) {
      console.error('[pluginStore] fetchInstalledPlugins error:', error);
      set({ isLoadingInstalled: false });
      throw error;
    }
  },

  installPlugin: async (forumId, pluginId, settings = {}) => {
    const response = await api.post(`/api/v1/forums/${forumId}/plugins`, {
      plugin_id: pluginId,
      settings,
    });
    
    const plugin = ensureObject<InstalledPlugin>(response.data, 'plugin') as InstalledPlugin;
    
    // Add to installed plugins list
    set((state) => ({
      installedPlugins: {
        ...state.installedPlugins,
        [forumId]: [...(state.installedPlugins[forumId] || []), plugin],
      },
    }));
    
    return plugin;
  },

  uninstallPlugin: async (forumId, pluginInstanceId) => {
    await api.delete(`/api/v1/forums/${forumId}/plugins/${pluginInstanceId}`);
    
    // Remove from installed plugins list
    set((state) => ({
      installedPlugins: {
        ...state.installedPlugins,
        [forumId]: (state.installedPlugins[forumId] || []).filter(
          (p) => p.id !== pluginInstanceId
        ),
      },
    }));
  },

  togglePlugin: async (forumId, pluginInstanceId) => {
    const response = await api.post(
      `/api/v1/forums/${forumId}/plugins/${pluginInstanceId}/toggle`
    );
    
    const updatedPlugin = ensureObject<InstalledPlugin>(response.data, 'plugin') as InstalledPlugin;
    
    // Update in installed plugins list
    set((state) => ({
      installedPlugins: {
        ...state.installedPlugins,
        [forumId]: (state.installedPlugins[forumId] || []).map((p) =>
          p.id === pluginInstanceId ? updatedPlugin : p
        ),
      },
    }));
    
    return updatedPlugin;
  },

  updatePluginSettings: async (forumId, pluginInstanceId, settings) => {
    const response = await api.put(
      `/api/v1/forums/${forumId}/plugins/${pluginInstanceId}`,
      { settings }
    );
    
    const updatedPlugin = ensureObject<InstalledPlugin>(response.data, 'plugin') as InstalledPlugin;
    
    // Update in installed plugins list
    set((state) => ({
      installedPlugins: {
        ...state.installedPlugins,
        [forumId]: (state.installedPlugins[forumId] || []).map((p) =>
          p.id === pluginInstanceId ? updatedPlugin : p
        ),
      },
    }));
    
    return updatedPlugin;
  },
}));

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get icon component name for a plugin icon string
 */
export function getPluginIconName(icon: string): string {
  const iconMap: Record<string, string> = {
    'code': 'CodeBracketIcon',
    'chart-bar': 'ChartBarIcon',
    'eye-slash': 'EyeSlashIcon',
    'trophy': 'TrophyIcon',
    'shield-check': 'ShieldCheckIcon',
    'chat-bubble': 'ChatBubbleLeftRightIcon',
    'play': 'PlayIcon',
    'tag': 'TagIcon',
    'bookmark': 'BookmarkIcon',
    'download': 'ArrowDownTrayIcon',
  };
  return iconMap[icon] || 'PuzzlePieceIcon';
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    'content': 'Content',
    'engagement': 'Engagement',
    'moderation': 'Moderation',
    'integration': 'Integration',
    'gamification': 'Gamification',
    'customization': 'Customization',
    'organization': 'Organization',
    'migration': 'Migration',
  };
  return categoryMap[category] || category;
}
