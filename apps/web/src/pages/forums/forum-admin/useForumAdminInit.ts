/**
 * useForumAdminInit - initialization effects that populate state from forum data
 */

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { ForumCategory, ForumModerator } from '@/modules/forums/store';
import type { ForumAppearance, ForumRule, MemberData, ModQueueItem, ForumAnalytics } from './types';

const logger = createLogger('ForumAdminInit');

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

/**
 * unknown for the forums module.
 */
/**
 * Hook for managing forum admin init.
 *
 * @param deps - The deps.
 */
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

      // Fetch analytics from API
      if (forumSlug) {
        api.get(`/api/v1/forums/${forumSlug}/analytics`)
          .then((res) => {
            const data = res.data?.data || res.data?.analytics || res.data;
            setAnalytics({
              totalMembers: data.total_members ?? forum.memberCount ?? 0,
              activeMembers: data.active_members ?? Math.floor((forum.memberCount || 0) * 0.3),
              totalPosts: data.total_posts ?? 0,
              totalComments: data.total_comments ?? 0,
              postsToday: data.posts_today ?? 0,
              postsThisWeek: data.posts_this_week ?? 0,
              topPosters: data.top_posters || [],
              growthRate: data.growth_rate ?? 0,
            });
          })
          .catch((error) => {
            logger.error('Failed to fetch forum analytics:', error);
            // Fallback: use available forum data
            setAnalytics({
              totalMembers: forum.memberCount || 0,
              activeMembers: 0,
              totalPosts: 0,
              totalComments: 0,
              postsToday: 0,
              postsThisWeek: 0,
              topPosters: [],
              growthRate: 0,
            });
          });

        // Fetch rules from API
        api.get(`/api/v1/forums/${forumSlug}/rules`)
          .then((res) => {
            const rules = res.data?.data || res.data?.rules || [];
            setRules(rules);
          })
          .catch((error) => {
            logger.error('Failed to fetch forum rules:', error);
            setRules([]);
          });

        // Fetch mod queue from API
        api.get(`/api/v1/forums/${forumSlug}/moderation/queue`)
          .then((res) => {
            const items = res.data?.data || res.data?.items || [];
            setModQueue(items);
          })
          .catch((error) => {
            logger.error('Failed to fetch mod queue:', error);
            setModQueue([]);
          });

        // Fetch members from API
        api.get(`/api/v1/forums/${forumSlug}/members`)
          .then((res) => {
            const members = res.data?.data || res.data?.members || [];
            setMembers(members);
          })
          .catch((error) => {
            logger.error('Failed to fetch forum members:', error);
            setMembers([]);
          });
      }
    }
  }, [forum]);

  // Redirect if not owner/moderator
  useEffect(() => {
    if (forum && !isModerator) {
      navigate(`/forums/${forumSlug}`);
    }
  }, [forum, isModerator, navigate, forumSlug]);
}
