import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSearchStore } from '@/modules/search/store';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('Search Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSearchStore.setState({
      query: '',
      category: 'all',
      users: [],
      groups: [],
      forums: [],
      posts: [],
      messages: [],
      isLoading: false,
      error: null,
      hasSearched: false,
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty query', () => {
      const state = useSearchStore.getState();
      expect(state.query).toBe('');
    });

    it('should have default category as all', () => {
      const state = useSearchStore.getState();
      expect(state.category).toBe('all');
    });

    it('should have empty result arrays', () => {
      const state = useSearchStore.getState();
      expect(state.users).toEqual([]);
      expect(state.groups).toEqual([]);
      expect(state.forums).toEqual([]);
      expect(state.posts).toEqual([]);
      expect(state.messages).toEqual([]);
    });

    it('should not be loading initially', () => {
      const state = useSearchStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      const state = useSearchStore.getState();
      expect(state.error).toBeNull();
    });

    it('should have hasSearched as false', () => {
      const state = useSearchStore.getState();
      expect(state.hasSearched).toBe(false);
    });
  });

  describe('setQuery', () => {
    it('should update the query', () => {
      useSearchStore.getState().setQuery('test query');
      expect(useSearchStore.getState().query).toBe('test query');
    });

    it('should allow empty query', () => {
      useSearchStore.getState().setQuery('test');
      useSearchStore.getState().setQuery('');
      expect(useSearchStore.getState().query).toBe('');
    });
  });

  describe('setCategory', () => {
    it('should update the category to users', () => {
      useSearchStore.getState().setCategory('users');
      expect(useSearchStore.getState().category).toBe('users');
    });

    it('should update the category to groups', () => {
      useSearchStore.getState().setCategory('groups');
      expect(useSearchStore.getState().category).toBe('groups');
    });

    it('should update the category to forums', () => {
      useSearchStore.getState().setCategory('forums');
      expect(useSearchStore.getState().category).toBe('forums');
    });

    it('should update the category to posts', () => {
      useSearchStore.getState().setCategory('posts');
      expect(useSearchStore.getState().category).toBe('posts');
    });

    it('should update the category to messages', () => {
      useSearchStore.getState().setCategory('messages');
      expect(useSearchStore.getState().category).toBe('messages');
    });

    it('should update the category back to all', () => {
      useSearchStore.getState().setCategory('users');
      useSearchStore.getState().setCategory('all');
      expect(useSearchStore.getState().category).toBe('all');
    });
  });

  describe('clearResults', () => {
    it('should clear all results', () => {
      // Set some results first
      useSearchStore.setState({
        users: [
          { id: '1', username: 'test', displayName: null, avatarUrl: null, status: 'online' },
        ],
        groups: [
          {
            id: '1',
            name: 'Test Group',
            slug: 'test-group',
            description: null,
            iconUrl: null,
            memberCount: 10,
            isPublic: true,
          },
        ],
        hasSearched: true,
      });

      useSearchStore.getState().clearResults();

      const state = useSearchStore.getState();
      expect(state.users).toEqual([]);
      expect(state.groups).toEqual([]);
      expect(state.forums).toEqual([]);
      expect(state.posts).toEqual([]);
      expect(state.messages).toEqual([]);
      expect(state.hasSearched).toBe(false);
    });

    it('should also reset query but not category', () => {
      useSearchStore.setState({
        query: 'test',
        category: 'users',
      });

      useSearchStore.getState().clearResults();

      const state = useSearchStore.getState();
      expect(state.query).toBe(''); // clearResults also resets query
      expect(state.category).toBe('users');
    });
  });

  describe('clearError', () => {
    it('should clear the error', () => {
      useSearchStore.setState({ error: 'Some error' });
      useSearchStore.getState().clearError();
      expect(useSearchStore.getState().error).toBeNull();
    });
  });

  describe('Search Categories', () => {
    it('should have valid category types', () => {
      const validCategories = ['all', 'users', 'groups', 'forums', 'posts', 'messages'] as const;
      validCategories.forEach((category) => {
        useSearchStore.getState().setCategory(category);
        expect(useSearchStore.getState().category).toBe(category);
      });
    });
  });
});
