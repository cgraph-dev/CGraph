/**
 * Forums endpoints — posts, comments, votes, categories.
 */
import type { HttpHelpers, ApiResponse, PaginatedResponse, PaginationParams } from '../client';

export interface ForumPost {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly author_id: string;
  readonly author_username: string;
  readonly category_id: string | null;
  readonly vote_count: number;
  readonly comment_count: number;
  readonly is_pinned: boolean;
  readonly inserted_at: string;
  readonly updated_at: string;
}

export interface ForumComment {
  readonly id: string;
  readonly body: string;
  readonly author_id: string;
  readonly author_username: string;
  readonly post_id: string;
  readonly parent_id: string | null;
  readonly vote_count: number;
  readonly inserted_at: string;
}

export interface ForumCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly post_count: number;
  readonly position: number;
}

export interface CreatePostRequest {
  readonly title: string;
  readonly body: string;
  readonly category_id?: string;
}

export interface CreateCommentRequest {
  readonly body: string;
  readonly parent_id?: string;
}

export interface ForumsEndpoints {
  getPosts(params?: PaginationParams & { category_id?: string; sort?: string }): Promise<PaginatedResponse<ForumPost>>;
  getPost(id: string): Promise<ApiResponse<ForumPost>>;
  createPost(data: CreatePostRequest): Promise<ApiResponse<ForumPost>>;
  updatePost(id: string, data: Partial<CreatePostRequest>): Promise<ApiResponse<ForumPost>>;
  deletePost(id: string): Promise<ApiResponse<void>>;
  vote(postId: string, direction: 1 | -1): Promise<ApiResponse<{ vote_count: number }>>;
  getComments(postId: string, params?: PaginationParams): Promise<PaginatedResponse<ForumComment>>;
  createComment(postId: string, data: CreateCommentRequest): Promise<ApiResponse<ForumComment>>;
  deleteComment(postId: string, commentId: string): Promise<ApiResponse<void>>;
  voteComment(postId: string, commentId: string, direction: 1 | -1): Promise<ApiResponse<{ vote_count: number }>>;
  getCategories(): Promise<ApiResponse<ForumCategory[]>>;
}

export function createForumsEndpoints(http: HttpHelpers): ForumsEndpoints {
  return {
    getPosts: (params) =>
      http.get('/api/v1/forum/posts', { cursor: params?.cursor, limit: params?.limit, category_id: params?.category_id, sort: params?.sort }),
    getPost: (id) =>
      http.get(`/api/v1/forum/posts/${id}`),
    createPost: (data) =>
      http.post('/api/v1/forum/posts', data),
    updatePost: (id, data) =>
      http.patch(`/api/v1/forum/posts/${id}`, data),
    deletePost: (id) =>
      http.del(`/api/v1/forum/posts/${id}`),
    vote: (postId, direction) =>
      http.post(`/api/v1/forum/posts/${postId}/vote`, { direction }),
    getComments: (postId, params) =>
      http.get(`/api/v1/forum/posts/${postId}/comments`, { cursor: params?.cursor, limit: params?.limit }),
    createComment: (postId, data) =>
      http.post(`/api/v1/forum/posts/${postId}/comments`, data),
    deleteComment: (postId, commentId) =>
      http.del(`/api/v1/forum/posts/${postId}/comments/${commentId}`),
    voteComment: (postId, commentId, direction) =>
      http.post(`/api/v1/forum/posts/${postId}/comments/${commentId}/vote`, { direction }),
    getCategories: () =>
      http.get('/api/v1/forum/categories'),
  };
}
