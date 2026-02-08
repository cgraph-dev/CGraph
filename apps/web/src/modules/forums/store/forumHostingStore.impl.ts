import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { mapBoardFromApi } from './forumHosting-mappers';
import {
  createThreadActions,
  createPostActions,
  createMemberActions,
} from './forumHosting-actions';

// Types
export type {
  Board,
  Thread,
  ThreadPost,
  ThreadAuthor,
  Forum,
  ForumMember,
  PaginationMeta,
  CreateBoardData,
  CreateThreadData,
  CreatePostData,
  UpdatePostData,
  ThreadListOptions,
  PostListOptions,
  MemberListOptions,
  ForumHostingState,
} from './forumHostingStore.types';

import type { CreateBoardData, ForumHostingState } from './forumHostingStore.types';

// =============================================================================
// Store Implementation
// =============================================================================

export const useForumHostingStore = create<ForumHostingState>((set) => ({
  boards: [],
  currentBoard: null,
  isLoadingBoards: false,

  threads: [],
  currentThread: null,
  threadsMeta: null,
  isLoadingThreads: false,

  posts: [],
  postsMeta: null,
  isLoadingPosts: false,

  members: [],
  membersMeta: null,
  isLoadingMembers: false,

  // =========================================================================
  // Boards
  // =========================================================================

  fetchBoards: async (forumId: string) => {
    set({ isLoadingBoards: true });
    try {
      const response = await api.get(`/api/v1/forums/${forumId}/boards`);

      const rawBoards = ensureArray<Record<string, unknown>>(response.data, 'data');
      const boards = rawBoards.map(mapBoardFromApi);
      set({ boards, isLoadingBoards: false });
    } catch (error) {
      set({ isLoadingBoards: false });
      throw error;
    }
  },

  fetchBoard: async (boardId: string) => {
    const response = await api.get(`/api/v1/boards/${boardId}`);
    const board = mapBoardFromApi(response.data.data);
    set({ currentBoard: board });
    return board;
  },

  createBoard: async (forumId: string, data: CreateBoardData) => {
    const response = await api.post(`/api/v1/forums/${forumId}/boards`, {
      board: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        position: data.position,
        parent_board_id: data.parentBoardId,
      },
    });
    const board = mapBoardFromApi(response.data.data);
    set((state) => ({ boards: [...state.boards, board] }));
    return board;
  },

  updateBoard: async (forumId: string, boardId: string, data: Partial<CreateBoardData>) => {
    const response = await api.put(`/api/v1/forums/${forumId}/boards/${boardId}`, {
      board: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        position: data.position,
        parent_board_id: data.parentBoardId,
      },
    });
    const board = mapBoardFromApi(response.data.data);
    set((state) => ({
      boards: state.boards.map((b) => (b.id === boardId ? board : b)),
    }));
    return board;
  },

  deleteBoard: async (forumId: string, boardId: string) => {
    await api.delete(`/api/v1/forums/${forumId}/boards/${boardId}`);
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== boardId),
    }));
  },

  // =========================================================================
  // Threads, Posts, Members (delegated to action slices)
  // =========================================================================

  ...createThreadActions(set),
  ...createPostActions(set),
  ...createMemberActions(set),
}));
