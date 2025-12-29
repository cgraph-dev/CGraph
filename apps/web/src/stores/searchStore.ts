import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray, ensureObject, extractErrorMessage } from '@/lib/apiUtils';

export interface SearchUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: string;
}

export interface SearchGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  memberCount: number;
  isPublic: boolean;
}

export interface SearchForum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  postCount: number;
  isPublic: boolean;
}

export interface SearchPost {
  id: string;
  title: string;
  content: string;
  author: SearchUser;
  forumSlug: string;
  createdAt: string;
}

export interface SearchMessage {
  id: string;
  content: string;
  sender: SearchUser;
  conversationId: string;
  createdAt: string;
}

export type SearchCategory = 'all' | 'users' | 'groups' | 'forums' | 'posts' | 'messages';

interface SearchState {
  query: string;
  category: SearchCategory;
  users: SearchUser[];
  groups: SearchGroup[];
  forums: SearchForum[];
  posts: SearchPost[];
  messages: SearchMessage[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;

  // Actions
  setQuery: (query: string) => void;
  setCategory: (category: SearchCategory) => void;
  search: (query?: string) => Promise<void>;
  searchById: (type: 'user' | 'group' | 'forum', id: string) => Promise<SearchUser | SearchGroup | SearchForum | null>;
  clearResults: () => void;
  clearError: () => void;
}

export const useSearchStore = create<SearchState>()((set, get) => ({
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

  setQuery: (query) => set({ query }),

  setCategory: (category) => set({ category }),

  search: async (queryOverride) => {
    const { query: stateQuery, category } = get();
    const query = queryOverride ?? stateQuery;
    
    if (!query.trim()) {
      set({ 
        users: [], 
        groups: [], 
        forums: [], 
        posts: [], 
        messages: [],
        hasSearched: false 
      });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const searchPromises: Promise<void>[] = [];

      // Search users
      if (category === 'all' || category === 'users') {
        searchPromises.push(
          api.get('/api/v1/search/users', { params: { q: query } })
            .then((res) => {
              set({ users: ensureArray<SearchUser>(res.data, 'users') });
            })
            .catch(() => set({ users: [] }))
        );
      }

      // Search messages
      if (category === 'all' || category === 'messages') {
        searchPromises.push(
          api.get('/api/v1/search/messages', { params: { q: query } })
            .then((res) => {
              set({ messages: ensureArray<SearchMessage>(res.data, 'messages') });
            })
            .catch(() => set({ messages: [] }))
        );
      }

      // Search posts
      if (category === 'all' || category === 'posts') {
        searchPromises.push(
          api.get('/api/v1/search/posts', { params: { q: query } })
            .then((res) => {
              set({ posts: ensureArray<SearchPost>(res.data, 'posts') });
            })
            .catch(() => set({ posts: [] }))
        );
      }

      // For groups and forums, use list endpoints with search params
      if (category === 'all' || category === 'groups') {
        searchPromises.push(
          api.get('/api/v1/groups', { params: { search: query } })
            .then((res) => {
              set({ groups: ensureArray<SearchGroup>(res.data, 'groups') });
            })
            .catch(() => set({ groups: [] }))
        );
      }

      if (category === 'all' || category === 'forums') {
        searchPromises.push(
          api.get('/api/v1/forums', { params: { search: query } })
            .then((res) => {
              set({ forums: ensureArray<SearchForum>(res.data, 'forums') });
            })
            .catch(() => set({ forums: [] }))
        );
      }

      await Promise.all(searchPromises);
      set({ isLoading: false, hasSearched: true });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Search failed'),
        isLoading: false,
        hasSearched: true,
      });
    }
  },

  searchById: async (type, id) => {
    try {
      let endpoint = '';
      switch (type) {
        case 'user':
          endpoint = `/api/v1/users/${id}`;
          break;
        case 'group':
          endpoint = `/api/v1/groups/${id}`;
          break;
        case 'forum':
          endpoint = `/api/v1/forums/${id}`;
          break;
      }

      const response = await api.get(endpoint);
      return ensureObject(response.data);
    } catch {
      return null;
    }
  },

  clearResults: () =>
    set({
      users: [],
      groups: [],
      forums: [],
      posts: [],
      messages: [],
      query: '',
      hasSearched: false,
    }),

  clearError: () => set({ error: null }),
}));
