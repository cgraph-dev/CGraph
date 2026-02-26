
export interface WallPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userLevel: number;
  isPremium: boolean;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  createdAt: Date;
  reactions?: Array<{ emoji: string; count: number }>;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  likesCount: number;
  isLiked: boolean;
}

export const MOCK_POSTS: WallPost[] = [
  {
    id: '1', userId: 'user1', userName: 'CyberNinja', userLevel: 42, isPremium: true,
    content: 'Just hit level 42! 🎉 The grind was worth it. Thanks to everyone who supported me along the way!',
    likesCount: 156, commentsCount: 23, sharesCount: 5, isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    reactions: [{ emoji: '🔥', count: 45 }, { emoji: '👏', count: 32 }, { emoji: '❤️', count: 79 }],
  },
  {
    id: '2', userId: 'user2', userName: 'PixelDragon', userLevel: 28, isPremium: false,
    content: 'New achievement unlocked: "Night Owl" 🦉 Stayed up way too late but totally worth it!',
    imageUrl: 'https://picsum.photos/400/300',
    likesCount: 89, commentsCount: 12, sharesCount: 2, isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    reactions: [{ emoji: '😂', count: 15 }, { emoji: '🎉', count: 24 }],
  },
  {
    id: '3', userId: 'user3', userName: 'MatrixHawk', userLevel: 55, isPremium: true,
    content: 'Pro tip: Use the keyboard shortcuts to navigate faster! Game changer 🚀',
    likesCount: 234, commentsCount: 45, sharesCount: 18, isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    reactions: [{ emoji: '🧠', count: 67 }, { emoji: '💯', count: 89 }, { emoji: '🚀', count: 78 }],
  },
];

export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}
