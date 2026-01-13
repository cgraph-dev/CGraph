/**
 * Forum Services (Mobile)
 */

import { API_URL } from '@/services/api';

export const forumApi = {
  getCategories: () => `${API_URL}/api/v1/forums/categories`,
  getBoards: () => `${API_URL}/api/v1/forums/boards`,
  getBoard: (id: string) => `${API_URL}/api/v1/forums/boards/${id}`,
  getThreads: (boardId: string) => `${API_URL}/api/v1/forums/boards/${boardId}/threads`,
  getThread: (id: string) => `${API_URL}/api/v1/forums/threads/${id}`,
  createThread: (boardId: string) => `${API_URL}/api/v1/forums/boards/${boardId}/threads`,
  getPosts: (threadId: string) => `${API_URL}/api/v1/forums/threads/${threadId}/posts`,
  createPost: (threadId: string) => `${API_URL}/api/v1/forums/threads/${threadId}/posts`,
  vote: (pollId: string) => `${API_URL}/api/v1/forums/polls/${pollId}/vote`,
};
