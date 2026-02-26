/**
 * Types and fallback data for the forum reorder screen.
 * @module screens/admin/forum-reorder-screen/types
 */

export interface Forum {
  id: string;
  name: string;
  description: string;
  threadCount: number;
  postCount: number;
  order: number;
  icon?: string;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  forums: Forum[];
  order: number;
  isExpanded: boolean;
}

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'General Discussion',
    order: 0,
    isExpanded: true,
    forums: [
      {
        id: 'f1', name: 'Announcements', description: 'Important news',
        threadCount: 15, postCount: 45, order: 0, color: '#ef4444',
      },
      {
        id: 'f2', name: 'Introductions', description: 'Say hello!',
        threadCount: 234, postCount: 567, order: 1, color: '#10b981',
      },
      {
        id: 'f3', name: 'Off-Topic', description: 'Casual chat',
        threadCount: 789, postCount: 2345, order: 2, color: '#6366f1',
      },
    ],
  },
  {
    id: '2',
    name: 'Technical',
    order: 1,
    isExpanded: true,
    forums: [
      {
        id: 'f4', name: 'Help & Support', description: 'Get help here',
        threadCount: 456, postCount: 1234, order: 0, color: '#f59e0b',
      },
      {
        id: 'f5', name: 'Bug Reports', description: 'Report issues',
        threadCount: 89, postCount: 234, order: 1, color: '#ef4444',
      },
      {
        id: 'f6', name: 'Feature Requests', description: 'Suggest features',
        threadCount: 123, postCount: 456, order: 2, color: '#8b5cf6',
      },
    ],
  },
];
