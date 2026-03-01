/**
 * Forum Service — HTTP wrappers for all forum-related API endpoints.
 *
 * Follows the pattern established by other services (groupsService, searchService).
 * Uses the shared `api` client from `lib/api`.
 *
 * @module services/forumService
 */

import api from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaginationParams {
  page?: number;
  per_page?: number;
}

interface SearchFilters {
  type?: 'threads' | 'posts' | 'comments';
  board_id?: string;
  forum_id?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const forumService = {
  // ─── Forums ──────────────────────────────────────────────────────────
  listForums: (params?: PaginationParams) =>
    api.get('/api/v1/forums', { params }),

  getForum: (id: string) =>
    api.get(`/api/v1/forums/${id}`),

  createForum: (data: Record<string, unknown>) =>
    api.post('/api/v1/forums', data),

  updateForum: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/v1/forums/${id}`, data),

  deleteForum: (id: string) =>
    api.delete(`/api/v1/forums/${id}`),

  // ─── Boards ──────────────────────────────────────────────────────────
  listBoards: (forumId: string, params?: PaginationParams) =>
    api.get(`/api/v1/forums/${forumId}/boards`, { params }),

  getBoard: (forumId: string, boardId: string) =>
    api.get(`/api/v1/forums/${forumId}/boards/${boardId}`),

  createBoard: (forumId: string, data: Record<string, unknown>) =>
    api.post(`/api/v1/forums/${forumId}/boards`, data),

  updateBoard: (forumId: string, boardId: string, data: Record<string, unknown>) =>
    api.patch(`/api/v1/forums/${forumId}/boards/${boardId}`, data),

  deleteBoard: (forumId: string, boardId: string) =>
    api.delete(`/api/v1/forums/${forumId}/boards/${boardId}`),

  // ─── Threads / Posts ─────────────────────────────────────────────────
  listThreads: (forumId: string, params?: PaginationParams) =>
    api.get(`/api/v1/forums/${forumId}/posts`, { params }),

  getPost: (postId: string) =>
    api.get(`/api/v1/posts/${postId}`),

  createPost: (forumId: string, data: Record<string, unknown>) =>
    api.post(`/api/v1/forums/${forumId}/posts`, data),

  updatePost: (postId: string, data: Record<string, unknown>) =>
    api.patch(`/api/v1/posts/${postId}`, data),

  deletePost: (postId: string) =>
    api.delete(`/api/v1/posts/${postId}`),

  // ─── Comments ────────────────────────────────────────────────────────
  listComments: (postId: string, params?: PaginationParams) =>
    api.get(`/api/v1/posts/${postId}/comments`, { params }),

  createComment: (postId: string, data: { content: string; parent_id?: string }) =>
    api.post(`/api/v1/posts/${postId}/comments`, data),

  updateComment: (commentId: string, data: { content: string }) =>
    api.patch(`/api/v1/comments/${commentId}`, data),

  deleteComment: (commentId: string) =>
    api.delete(`/api/v1/comments/${commentId}`),

  // ─── Votes ───────────────────────────────────────────────────────────
  votePost: (postId: string, value: 1 | -1) =>
    api.post(`/api/v1/posts/${postId}/vote`, { value }),

  voteComment: (commentId: string, value: 1 | -1) =>
    api.post(`/api/v1/comments/${commentId}/vote`, { value }),

  // ─── Polls ───────────────────────────────────────────────────────────
  votePoll: (pollId: string, optionIds: string[]) =>
    api.post(`/api/v1/polls/${pollId}/vote`, { option_ids: optionIds }),

  closePoll: (pollId: string) =>
    api.post(`/api/v1/polls/${pollId}/close`),

  // ─── Search ──────────────────────────────────────────────────────────
  searchForums: (query: string, filters?: SearchFilters) =>
    api.get('/api/v1/search/forums', { params: { q: query, ...filters } }),
};

export default forumService;
