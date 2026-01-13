/**
 * Forum Services
 * 
 * API and business logic services for forums.
 */

// API endpoints for forums
export const forumApi = {
  // Board/Category endpoints
  getCategories: () => '/api/v1/forums/categories',
  getCategory: (id: string) => `/api/v1/forums/categories/${id}`,
  
  // Board endpoints
  getBoards: () => '/api/v1/forums/boards',
  getBoard: (id: string) => `/api/v1/forums/boards/${id}`,
  createBoard: () => '/api/v1/forums/boards',
  
  // Thread endpoints
  getThreads: (boardId: string) => `/api/v1/forums/boards/${boardId}/threads`,
  getThread: (id: string) => `/api/v1/forums/threads/${id}`,
  createThread: (boardId: string) => `/api/v1/forums/boards/${boardId}/threads`,
  updateThread: (id: string) => `/api/v1/forums/threads/${id}`,
  deleteThread: (id: string) => `/api/v1/forums/threads/${id}`,
  
  // Post endpoints
  getPosts: (threadId: string) => `/api/v1/forums/threads/${threadId}/posts`,
  createPost: (threadId: string) => `/api/v1/forums/threads/${threadId}/posts`,
  updatePost: (id: string) => `/api/v1/forums/posts/${id}`,
  deletePost: (id: string) => `/api/v1/forums/posts/${id}`,
  
  // Poll endpoints
  getPoll: (threadId: string) => `/api/v1/forums/threads/${threadId}/poll`,
  vote: (pollId: string) => `/api/v1/forums/polls/${pollId}/vote`,
  
  // Moderation endpoints
  reportPost: (postId: string) => `/api/v1/forums/posts/${postId}/report`,
  moderateThread: (threadId: string, action: string) => `/api/v1/forums/threads/${threadId}/${action}`,
  
  // Subscription endpoints
  subscribe: (threadId: string) => `/api/v1/forums/threads/${threadId}/subscribe`,
  unsubscribe: (threadId: string) => `/api/v1/forums/threads/${threadId}/unsubscribe`,
};

// BBCode parser utility
export const parseBBCode = (content: string): string => {
  // BBCode to HTML conversion
  return content
    .replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>')
    .replace(/\[s\](.*?)\[\/s\]/gi, '<s>$1</s>')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$2</a>')
    .replace(/\[img\](.*?)\[\/img\]/gi, '<img src="$1" alt="" loading="lazy" />')
    .replace(/\[quote\](.*?)\[\/quote\]/gis, '<blockquote>$1</blockquote>')
    .replace(/\[code\](.*?)\[\/code\]/gis, '<pre><code>$1</code></pre>')
    .replace(/\[color=(.*?)\](.*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
    .replace(/\[size=(.*?)\](.*?)\[\/size\]/gi, '<span style="font-size:$1">$2</span>');
};
