/**
 * pluginStore Unit Tests
 *
 * Tests for Zustand plugin store state management.
 * Covers marketplace browsing and installed plugin management.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { usePluginStore } from '@/modules/settings/store';
import type { MarketplacePlugin, InstalledPlugin } from '@/modules/settings/store';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// Mock marketplace plugin
const mockMarketplacePlugin: MarketplacePlugin = {
  plugin_id: 'plugin-1',
  name: 'Awesome Plugin',
  description: 'An awesome plugin for forums',
  version: '1.0.0',
  author: 'Plugin Author',
  author_url: 'https://example.com',
  category: 'utility',
  icon: '🔌',
  download_count: 1500,
  rating: 4.5,
  is_official: false,
};

const mockMarketplacePlugin2: MarketplacePlugin = {
  plugin_id: 'plugin-2',
  name: 'Official Theme Plugin',
  description: 'Official theme plugin',
  version: '2.0.0',
  author: 'CGraph Team',
  author_url: 'https://cgraph.dev',
  category: 'themes',
  icon: '🎨',
  download_count: 5000,
  rating: 5.0,
  is_official: true,
};

// Mock installed plugin
const mockInstalledPlugin: InstalledPlugin = {
  id: 'installed-1',
  plugin_id: 'plugin-1',
  name: 'Awesome Plugin',
  description: 'An awesome plugin for forums',
  version: '1.0.0',
  author: 'Plugin Author',
  author_url: 'https://example.com',
  is_active: true,
  is_core: false,
  settings: { option1: 'value1' },
  hooks: ['before_post', 'after_post'],
  css_files: ['/plugins/awesome/style.css'],
  js_files: ['/plugins/awesome/script.js'],
  position: 1,
  installed_at: '2026-01-15T10:00:00Z',
  forum_id: 'forum-1',
};

const mockInstalledPlugin2: InstalledPlugin = {
  id: 'installed-2',
  plugin_id: 'plugin-2',
  name: 'Official Theme Plugin',
  description: 'Official theme plugin',
  version: '2.0.0',
  author: 'CGraph Team',
  author_url: 'https://cgraph.dev',
  is_active: false,
  is_core: true,
  settings: {},
  hooks: ['theme_init'],
  css_files: [],
  js_files: [],
  position: 0,
  installed_at: '2026-01-01T00:00:00Z',
  forum_id: 'forum-1',
};

describe('pluginStore', () => {
  beforeEach(() => {
    // Reset store state
    usePluginStore.setState({
      marketplacePlugins: [],
      marketplaceCategories: [],
      isLoadingMarketplace: false,
      installedPlugins: {},
      isLoadingInstalled: false,
    });

    // Clear mock calls
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty marketplace plugins', () => {
      const state = usePluginStore.getState();
      expect(state.marketplacePlugins).toEqual([]);
    });

    it('should have empty marketplace categories', () => {
      const state = usePluginStore.getState();
      expect(state.marketplaceCategories).toEqual([]);
    });

    it('should not be loading initially', () => {
      const state = usePluginStore.getState();
      expect(state.isLoadingMarketplace).toBe(false);
      expect(state.isLoadingInstalled).toBe(false);
    });

    it('should have empty installed plugins', () => {
      const state = usePluginStore.getState();
      expect(state.installedPlugins).toEqual({});
    });
  });

  describe('fetchMarketplace', () => {
    it('should fetch marketplace plugins successfully', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          data: [mockMarketplacePlugin, mockMarketplacePlugin2],
          meta: { categories: ['utility', 'themes'] },
        },
      });

      const { fetchMarketplace } = usePluginStore.getState();
      await fetchMarketplace();

      const state = usePluginStore.getState();
      expect(state.marketplacePlugins).toHaveLength(2);
      expect(state.marketplaceCategories).toEqual(['utility', 'themes']);
      expect(state.isLoadingMarketplace).toBe(false);
    });

    it('should fetch with category filter', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { data: [mockMarketplacePlugin], meta: {} },
      });

      const { fetchMarketplace } = usePluginStore.getState();
      await fetchMarketplace({ category: 'utility' });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/plugins/marketplace?category=utility');
    });

    it('should fetch with search filter', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { data: [], meta: {} },
      });

      const { fetchMarketplace } = usePluginStore.getState();
      await fetchMarketplace({ search: 'theme' });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/plugins/marketplace?search=theme');
    });

    it('should fetch official plugins only', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { data: [mockMarketplacePlugin2], meta: {} },
      });

      const { fetchMarketplace } = usePluginStore.getState();
      await fetchMarketplace({ official: true });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/plugins/marketplace?official=true');
    });

    it('should handle fetch error', async () => {
      const error = new Error('Network error');
      mockedApi.get.mockRejectedValueOnce(error);

      const { fetchMarketplace } = usePluginStore.getState();

      await expect(fetchMarketplace()).rejects.toThrow('Network error');

      const state = usePluginStore.getState();
      expect(state.isLoadingMarketplace).toBe(false);
    });
  });

  describe('getMarketplacePlugin', () => {
    it('should fetch single plugin details', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { plugin: mockMarketplacePlugin },
      });

      const { getMarketplacePlugin } = usePluginStore.getState();
      const plugin = await getMarketplacePlugin('plugin-1');

      expect(plugin).toEqual(mockMarketplacePlugin);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/plugins/marketplace/plugin-1');
    });
  });

  describe('fetchInstalledPlugins', () => {
    it('should fetch installed plugins for a forum', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { data: [mockInstalledPlugin, mockInstalledPlugin2] },
      });

      const { fetchInstalledPlugins } = usePluginStore.getState();
      await fetchInstalledPlugins('forum-1');

      const state = usePluginStore.getState();
      expect(state.installedPlugins['forum-1']).toHaveLength(2);
      expect(state.isLoadingInstalled).toBe(false);
    });

    it('should handle multiple forums', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { data: [mockInstalledPlugin] } })
        .mockResolvedValueOnce({ data: { data: [mockInstalledPlugin2] } });

      const { fetchInstalledPlugins } = usePluginStore.getState();

      await fetchInstalledPlugins('forum-1');
      await fetchInstalledPlugins('forum-2');

      const state = usePluginStore.getState();
      expect(state.installedPlugins['forum-1']).toHaveLength(1);
      expect(state.installedPlugins['forum-2']).toHaveLength(1);
    });

    it('should handle fetch error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Not found'));

      const { fetchInstalledPlugins } = usePluginStore.getState();

      await expect(fetchInstalledPlugins('forum-1')).rejects.toThrow('Not found');

      const state = usePluginStore.getState();
      expect(state.isLoadingInstalled).toBe(false);
    });
  });

  describe('installPlugin', () => {
    it('should install a plugin to a forum', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { plugin: mockInstalledPlugin },
      });

      const { installPlugin } = usePluginStore.getState();
      const installed = await installPlugin('forum-1', 'plugin-1', { option1: 'value1' });

      expect(installed).toEqual(mockInstalledPlugin);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/forums/forum-1/plugins', {
        plugin_id: 'plugin-1',
        settings: { option1: 'value1' },
      });
    });

    it('should install without custom settings', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { plugin: mockInstalledPlugin },
      });

      const { installPlugin } = usePluginStore.getState();
      await installPlugin('forum-1', 'plugin-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/forums/forum-1/plugins', {
        plugin_id: 'plugin-1',
        settings: {},
      });
    });
  });

  describe('uninstallPlugin', () => {
    it('should uninstall a plugin from a forum', async () => {
      // Setup: Add plugin to state first
      usePluginStore.setState({
        installedPlugins: { 'forum-1': [mockInstalledPlugin] },
      });

      mockedApi.delete.mockResolvedValueOnce({ data: {} });

      const { uninstallPlugin } = usePluginStore.getState();
      await uninstallPlugin('forum-1', 'installed-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/forums/forum-1/plugins/installed-1');
    });
  });

  describe('togglePlugin', () => {
    it('should toggle plugin active state', async () => {
      const toggledPlugin = { ...mockInstalledPlugin, is_active: false };
      mockedApi.post.mockResolvedValueOnce({
        data: { plugin: toggledPlugin },
      });

      const { togglePlugin } = usePluginStore.getState();
      const result = await togglePlugin('forum-1', 'installed-1');

      expect(result.is_active).toBe(false);
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/forums/forum-1/plugins/installed-1/toggle'
      );
    });
  });

  describe('updatePluginSettings', () => {
    it('should update plugin settings', async () => {
      const updatedPlugin = {
        ...mockInstalledPlugin,
        settings: { option1: 'new_value', option2: 'added' },
      };
      mockedApi.put.mockResolvedValueOnce({
        data: { plugin: updatedPlugin },
      });

      const { updatePluginSettings } = usePluginStore.getState();
      const result = await updatePluginSettings('forum-1', 'installed-1', {
        option1: 'new_value',
        option2: 'added',
      });

      expect(result.settings).toEqual({ option1: 'new_value', option2: 'added' });
    });
  });
});
