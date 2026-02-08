/**
 * Search Store Unit Tests
 *
 * Tests for the modular Zustand search store (modules/search/store).
 * Covers query/category management, multi-category search, searchById,
 * result clearing, error handling, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { useSearchStore } from '@/modules/search/store';
import type {
  SearchUser,
  SearchGroup,
  SearchForum,
  SearchPost,
  SearchMessage,
  SearchCategory,
} from '@/modules/search/store';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from '@/lib/api';

const mockedGet = api.get as MockedFunction<typeof api.get>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser: SearchUser = {
  id: 'u1',
  username: 'alice',
  displayName: 'Alice',
  avatarUrl: 'https://cdn.example.com/alice.png',
  status: 'online',
};

const mockGroup: SearchGroup = {
  id: 'g1',
  name: 'Developers',
  slug: 'developers',
  description: 'A group for devs',
  iconUrl: null,
  memberCount: 42,
  isPublic: true,
};

const mockForum: SearchForum = {
  id: 'f1',
  name: 'General',
  slug: 'general',
  description: 'General discussion',
  iconUrl: null,
  postCount: 1024,
  isPublic: true,
};

const mockPost: SearchPost = {
  id: 'p1',
  title: 'Hello World',
  content: 'This is a post',
  author: mockUser,
  forumSlug: 'general',
  createdAt: '2026-02-01T00:00:00Z',
};

const mockMessage: SearchMessage = {
  id: 'm1',
  content: 'Hey there',
  sender: mockUser,
  conversationId: 'conv-1',
  createdAt: '2026-02-02T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getInitialState = () => ({
  query: '',
  category: 'all' as SearchCategory,
  users: [] as SearchUser[],
  groups: [] as SearchGroup[],
  forums: [] as SearchForum[],
  posts: [] as SearchPost[],
  messages: [] as SearchMessage[],
  isLoading: false,
  error: null as string | null,
  hasSearched: false,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  useSearchStore.setState(getInitialState());
  vi.clearAllMocks();
});

describe('Search Store', () => {
  // -----------------------------------------------------------------------
  // 1. Initial state
  // -----------------------------------------------------------------------
  describe('initial state', () => {
    beforeEach(() => {
      useSearchStore.setState(getInitialState());
    });

    it('should have empty query', () => {
      expect(useSearchStore.getState().query).toBe('');
    });

    it('should default category to "all"', () => {
      expect(useSearchStore.getState().category).toBe('all');
    });

    it('should have empty result arrays', () => {
      const s = useSearchStore.getState();
      expect(s.users).toEqual([]);
      expect(s.groups).toEqual([]);
      expect(s.forums).toEqual([]);
      expect(s.posts).toEqual([]);
      expect(s.messages).toEqual([]);
    });

    it('should not be loading', () => {
      expect(useSearchStore.getState().isLoading).toBe(false);
    });

    it('should have no error', () => {
      expect(useSearchStore.getState().error).toBeNull();
    });

    it('should have hasSearched as false', () => {
      expect(useSearchStore.getState().hasSearched).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 2. setQuery
  // -----------------------------------------------------------------------
  describe('setQuery', () => {
    it('should update the query', () => {
      useSearchStore.getState().setQuery('hello');
      expect(useSearchStore.getState().query).toBe('hello');
    });

    it('should allow setting back to empty string', () => {
      useSearchStore.getState().setQuery('test');
      useSearchStore.getState().setQuery('');
      expect(useSearchStore.getState().query).toBe('');
    });
  });

  // -----------------------------------------------------------------------
  // 3. setCategory
  // -----------------------------------------------------------------------
  describe('setCategory', () => {
    const categories: SearchCategory[] = ['all', 'users', 'groups', 'forums', 'posts', 'messages'];

    it.each(categories)('should set category to "%s"', (cat) => {
      useSearchStore.getState().setCategory(cat);
      expect(useSearchStore.getState().category).toBe(cat);
    });

    it('should switch categories without affecting query', () => {
      useSearchStore.getState().setQuery('my query');
      useSearchStore.getState().setCategory('posts');
      expect(useSearchStore.getState().query).toBe('my query');
      expect(useSearchStore.getState().category).toBe('posts');
    });
  });

  // -----------------------------------------------------------------------
  // 4. search – category "all"
  // -----------------------------------------------------------------------
  describe('search (category: all)', () => {
    beforeEach(() => {
      useSearchStore.setState({ category: 'all' });
    });

    it('should set isLoading while searching', async () => {
      mockedGet.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 50))
      );

      useSearchStore.getState().setQuery('test');
      const p = useSearchStore.getState().search();
      expect(useSearchStore.getState().isLoading).toBe(true);
      await p;
      expect(useSearchStore.getState().isLoading).toBe(false);
    });

    it('should call all five search endpoints', async () => {
      mockedGet.mockResolvedValue({ data: [] });
      useSearchStore.getState().setQuery('hello');
      await useSearchStore.getState().search();

      expect(mockedGet).toHaveBeenCalledWith('/api/v1/search/users', { params: { q: 'hello' } });
      expect(mockedGet).toHaveBeenCalledWith('/api/v1/search/messages', { params: { q: 'hello' } });
      expect(mockedGet).toHaveBeenCalledWith('/api/v1/search/posts', { params: { q: 'hello' } });
      expect(mockedGet).toHaveBeenCalledWith('/api/v1/groups', { params: { search: 'hello' } });
      expect(mockedGet).toHaveBeenCalledWith('/api/v1/forums', { params: { search: 'hello' } });
    });

    it('should populate result arrays from API responses', async () => {
      mockedGet.mockImplementation((url: string) => {
        if (url.includes('search/users')) return Promise.resolve({ data: [mockUser] });
        if (url.includes('groups')) return Promise.resolve({ data: [mockGroup] });
        if (url.includes('forums')) return Promise.resolve({ data: [mockForum] });
        if (url.includes('search/posts')) return Promise.resolve({ data: [mockPost] });
        if (url.includes('search/messages')) return Promise.resolve({ data: [mockMessage] });
        return Promise.resolve({ data: [] });
      });

      useSearchStore.getState().setQuery('test');
      await useSearchStore.getState().search();

      const s = useSearchStore.getState();
      expect(s.users).toHaveLength(1);
      expect(s.groups).toHaveLength(1);
      expect(s.forums).toHaveLength(1);
      expect(s.posts).toHaveLength(1);
      expect(s.messages).toHaveLength(1);
      expect(s.hasSearched).toBe(true);
    });

    it('should set hasSearched to true after search completes', async () => {
      mockedGet.mockResolvedValue({ data: [] });
      useSearchStore.getState().setQuery('anything');
      await useSearchStore.getState().search();
      expect(useSearchStore.getState().hasSearched).toBe(true);
    });

    it('should clear results and set hasSearched false when query is blank', async () => {
      useSearchStore.setState({ users: [mockUser], hasSearched: true });
      useSearchStore.getState().setQuery('   ');
      await useSearchStore.getState().search();

      const s = useSearchStore.getState();
      expect(s.users).toEqual([]);
      expect(s.hasSearched).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 5. search – single category
  // -----------------------------------------------------------------------
  describe('search (single category)', () => {
    it('should only search users when category is "users"', async () => {
      mockedGet.mockResolvedValue({ data: [mockUser] });
      useSearchStore.setState({ category: 'users' });
      useSearchStore.getState().setQuery('alice');

      await useSearchStore.getState().search();

      expect(mockedGet).toHaveBeenCalledWith('/api/v1/search/users', { params: { q: 'alice' } });
      // Should NOT call groups / forums / posts / messages endpoints
      expect(mockedGet).not.toHaveBeenCalledWith('/api/v1/groups', expect.anything());
      expect(mockedGet).not.toHaveBeenCalledWith('/api/v1/forums', expect.anything());
    });

    it('should only search groups when category is "groups"', async () => {
      mockedGet.mockResolvedValue({ data: [mockGroup] });
      useSearchStore.setState({ category: 'groups' });
      useSearchStore.getState().setQuery('dev');

      await useSearchStore.getState().search();

      expect(mockedGet).toHaveBeenCalledWith('/api/v1/groups', { params: { search: 'dev' } });
      expect(mockedGet).not.toHaveBeenCalledWith('/api/v1/search/users', expect.anything());
    });

    it('should only search posts when category is "posts"', async () => {
      mockedGet.mockResolvedValue({ data: [mockPost] });
      useSearchStore.setState({ category: 'posts' });
      useSearchStore.getState().setQuery('hello');

      await useSearchStore.getState().search();

      expect(mockedGet).toHaveBeenCalledWith('/api/v1/search/posts', { params: { q: 'hello' } });
      expect(mockedGet).not.toHaveBeenCalledWith('/api/v1/search/messages', expect.anything());
    });
  });

  // -----------------------------------------------------------------------
  // 6. search with queryOverride
  // -----------------------------------------------------------------------
  describe('search with queryOverride', () => {
    it('should use queryOverride instead of state query', async () => {
      mockedGet.mockResolvedValue({ data: [] });
      useSearchStore.getState().setQuery('original');
      await useSearchStore.getState().search('override');

      expect(mockedGet).toHaveBeenCalledWith('/api/v1/search/users', { params: { q: 'override' } });
    });
  });

  // -----------------------------------------------------------------------
  // 7. search – per-category error resilience
  // -----------------------------------------------------------------------
  describe('search error resilience', () => {
    it('should fall back to empty array if one endpoint rejects', async () => {
      mockedGet.mockImplementation((url: string) => {
        if (url.includes('search/users')) return Promise.reject(new Error('User search down'));
        return Promise.resolve({ data: [mockPost] });
      });

      useSearchStore.setState({ category: 'all' });
      useSearchStore.getState().setQuery('test');
      await useSearchStore.getState().search();

      // Users should be empty (catch handler), other categories filled
      expect(useSearchStore.getState().users).toEqual([]);
      expect(useSearchStore.getState().posts).toHaveLength(1);
      expect(useSearchStore.getState().hasSearched).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 8. searchById
  // -----------------------------------------------------------------------
  describe('searchById', () => {
    it('should fetch a user by ID', async () => {
      mockedGet.mockResolvedValue({ data: { id: 'u1', username: 'alice' } });

      const result = await useSearchStore.getState().searchById('user', 'u1');
      expect(mockedGet).toHaveBeenCalledWith('/api/v1/users/u1');
      expect(result).not.toBeNull();
    });

    it('should fetch a group by ID', async () => {
      mockedGet.mockResolvedValue({ data: { id: 'g1', name: 'Devs' } });

      const result = await useSearchStore.getState().searchById('group', 'g1');
      expect(mockedGet).toHaveBeenCalledWith('/api/v1/groups/g1');
      expect(result).not.toBeNull();
    });

    it('should fetch a forum by ID', async () => {
      mockedGet.mockResolvedValue({ data: { id: 'f1', name: 'General' } });

      const result = await useSearchStore.getState().searchById('forum', 'f1');
      expect(mockedGet).toHaveBeenCalledWith('/api/v1/forums/f1');
      expect(result).not.toBeNull();
    });

    it('should return null when the API call fails', async () => {
      mockedGet.mockRejectedValue(new Error('404'));

      const result = await useSearchStore.getState().searchById('user', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 9. clearResults
  // -----------------------------------------------------------------------
  describe('clearResults', () => {
    it('should reset all result arrays, query, and hasSearched', () => {
      useSearchStore.setState({
        users: [mockUser],
        groups: [mockGroup],
        forums: [mockForum],
        posts: [mockPost],
        messages: [mockMessage],
        query: 'something',
        hasSearched: true,
      });

      useSearchStore.getState().clearResults();

      const s = useSearchStore.getState();
      expect(s.users).toEqual([]);
      expect(s.groups).toEqual([]);
      expect(s.forums).toEqual([]);
      expect(s.posts).toEqual([]);
      expect(s.messages).toEqual([]);
      expect(s.query).toBe('');
      expect(s.hasSearched).toBe(false);
    });

    it('should NOT reset category', () => {
      useSearchStore.setState({ category: 'users', query: 'test' });
      useSearchStore.getState().clearResults();
      expect(useSearchStore.getState().category).toBe('users');
    });
  });

  // -----------------------------------------------------------------------
  // 10. clearError
  // -----------------------------------------------------------------------
  describe('clearError', () => {
    it('should set error to null', () => {
      useSearchStore.setState({ error: 'Something broke' });
      useSearchStore.getState().clearError();
      expect(useSearchStore.getState().error).toBeNull();
    });

    it('should be a no-op when error is already null', () => {
      useSearchStore.getState().clearError();
      expect(useSearchStore.getState().error).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 11. Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('should not make API calls when searching with empty string', async () => {
      useSearchStore.getState().setQuery('');
      await useSearchStore.getState().search();
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('should not make API calls when searching with whitespace-only string', async () => {
      useSearchStore.getState().setQuery('   ');
      await useSearchStore.getState().search();
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it('should handle empty API responses gracefully', async () => {
      mockedGet.mockResolvedValue({ data: [] });
      useSearchStore.getState().setQuery('xyz');
      await useSearchStore.getState().search();

      const s = useSearchStore.getState();
      expect(s.users).toEqual([]);
      expect(s.hasSearched).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 12. State isolation
  // -----------------------------------------------------------------------
  describe('state isolation', () => {
    it('should not change results when only query changes', () => {
      useSearchStore.setState({ users: [mockUser], query: 'old' });
      useSearchStore.getState().setQuery('new');

      expect(useSearchStore.getState().users).toHaveLength(1);
      expect(useSearchStore.getState().query).toBe('new');
    });

    it('should not change query when only category changes', () => {
      useSearchStore.setState({ query: 'hello' });
      useSearchStore.getState().setCategory('forums');

      expect(useSearchStore.getState().query).toBe('hello');
    });

    it('should preserve error when results are cleared', () => {
      useSearchStore.setState({ error: 'an error', users: [mockUser] });
      useSearchStore.getState().clearResults();

      // clearResults doesn't touch error
      expect(useSearchStore.getState().error).toBe('an error');
    });
  });
});
