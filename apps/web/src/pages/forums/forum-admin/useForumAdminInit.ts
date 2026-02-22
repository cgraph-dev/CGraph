/**
 * useForumAdminInit - initialization effects that populate state from forum data
 */

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ForumCategory, ForumModerator } from '@/modules/forums/store';
import type { ForumAppearance, ForumRule, MemberData, ModQueueItem, ForumAnalytics } from './types';

interface ForumLike {
  name: string;
  description?: string | null;
  isPublic?: boolean;
  isNsfw?: boolean;
  categories?: ForumCategory[];
  moderators?: ForumModerator[];
  iconUrl?: string | null;
  bannerUrl?: string | null;
  customCss?: string | null;
  memberCount?: number;
}

interface InitDeps {
  forum: ForumLike | undefined;
  forumSlug: string | undefined;
  isModerator: boolean;
  fetchForum: (slug: string) => void;
  setName: Dispatch<SetStateAction<string>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setIsPublic: Dispatch<SetStateAction<boolean>>;
  setIsNsfw: Dispatch<SetStateAction<boolean>>;
  setCategories: Dispatch<SetStateAction<ForumCategory[]>>;
  setModerators: Dispatch<SetStateAction<ForumModerator[]>>;
  setAppearance: Dispatch<SetStateAction<ForumAppearance>>;
  setAnalytics: Dispatch<SetStateAction<ForumAnalytics>>;
  setRules: Dispatch<SetStateAction<ForumRule[]>>;
  setModQueue: Dispatch<SetStateAction<ModQueueItem[]>>;
  setMembers: Dispatch<SetStateAction<MemberData[]>>;
}

export function useForumAdminInit(deps: InitDeps) {
  const {
    forum,
    forumSlug,
    isModerator,
    fetchForum,
    setName,
    setDescription,
    setIsPublic,
    setIsNsfw,
    setCategories,
    setModerators,
    setAppearance,
    setAnalytics,
    setRules,
    setModQueue,
    setMembers,
  } = deps;

  const navigate = useNavigate();

  // Fetch forum on mount
  useEffect(() => {
    if (forumSlug) {
      fetchForum(forumSlug);
    }
  }, [forumSlug, fetchForum]);

  // Initialize state from forum data
  useEffect(() => {
    if (forum) {
      setName(forum.name);
      setDescription(forum.description || '');
      setIsPublic(forum.isPublic ?? true);
      setIsNsfw(forum.isNsfw ?? false);
      setCategories(forum.categories || []);
      setModerators(forum.moderators || []);

      // Load appearance
      setAppearance({
        iconUrl: forum.iconUrl || '',
        bannerUrl: forum.bannerUrl || '',
        primaryColor: '#8B5CF6',
        secondaryColor: '#6366F1',
        accentColor: '#EC4899',
        themePreset: 'default',
        customCss: forum.customCss || '',
        headerStyle: 'default',
        cardStyle: 'default',
      });

      // Mock analytics data
      setAnalytics({
        totalMembers: forum.memberCount || 0,
        activeMembers: Math.floor((forum.memberCount || 0) * 0.3),
        totalPosts: Math.floor(Math.random() * 500) + 50,
        totalComments: Math.floor(Math.random() * 2000) + 200,
        postsToday: Math.floor(Math.random() * 20),
        postsThisWeek: Math.floor(Math.random() * 100),
        topPosters: [
          { username: 'user1', count: 45 },
          { username: 'user2', count: 38 },
          { username: 'user3', count: 32 },
        ],
        growthRate: Math.floor(Math.random() * 30) - 5,
      });

      // Mock rules
      setRules([
        {
          id: '1',
          title: 'Be Respectful',
          description:
            'Treat others with respect. No harassment, hate speech, or personal attacks.',
          order: 1,
        },
        {
          id: '2',
          title: 'Stay On Topic',
          description: "Keep discussions relevant to the forum's purpose.",
          order: 2,
        },
        {
          id: '3',
          title: 'No Spam',
          description: "Don't post spam, self-promotion, or duplicate content.",
          order: 3,
        },
      ]);

      // Mock mod queue
      setModQueue([
        {
          id: '1',
          type: 'report',
          content: 'Inappropriate language in post',
          author: 'user123',
          authorId: '1',
          reason: 'Harassment',
          reportedBy: 'user456',
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          type: 'post',
          content: 'New post awaiting approval',
          author: 'newuser',
          authorId: '2',
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
      ]);

      // Mock members
      setMembers([
        {
          id: '1',
          username: 'topuser',
          displayName: 'Top User',
          role: 'admin',
          joinedAt: '2024-01-01',
          postCount: 150,
          karma: 500,
        },
        {
          id: '2',
          username: 'activemod',
          displayName: 'Active Mod',
          role: 'moderator',
          joinedAt: '2024-02-15',
          postCount: 89,
          karma: 320,
        },
        {
          id: '3',
          username: 'contributor1',
          displayName: 'Contributor One',
          role: 'contributor',
          joinedAt: '2024-03-20',
          postCount: 45,
          karma: 180,
        },
      ]);
    }
  }, [forum]);

  // Redirect if not owner/moderator
  useEffect(() => {
    if (forum && !isModerator) {
      navigate(`/forums/${forumSlug}`);
    }
  }, [forum, isModerator, navigate, forumSlug]);
}
