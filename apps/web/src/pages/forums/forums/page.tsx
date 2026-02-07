/**
 * Forums page - main component orchestrating forum browsing
 * @module pages/forums/forums/page
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForumStore } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { ForumHeader } from './forum-header';
import { SortControls } from './sort-controls';
import { PostsList } from './posts-list';
import { ForumSidebar } from './forum-sidebar';
import type { ForumSidebarProps } from './types';

/**
 * Ambient particle component for background effects
 */
function AmbientParticles() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-primary-500/30"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
            x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)],
            opacity: [0, 0.6, 0],
            scale: [null, Math.random() * 1.5 + 0.5],
          }}
          transition={{
            duration: Math.random() * 10 + 15,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
}

export default function Forums() {
  const { forumSlug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    forums,
    posts,
    isLoadingForums,
    isLoadingPosts,
    hasMorePosts,
    sortBy,
    timeRange,
    fetchForums,
    fetchForum,
    fetchPosts,
    vote,
    subscribe,
    unsubscribe,
    setSortBy,
    setTimeRange,
  } = useForumStore();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [page, setPage] = useState(1);

  const activeForum = forumSlug ? forums.find((f) => f.slug === forumSlug) : null;

  useEffect(() => {
    fetchForums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (forumSlug) {
      fetchForum(forumSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumSlug]);

  useEffect(() => {
    setPage(1);
    fetchPosts(forumSlug, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumSlug, sortBy, timeRange]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(forumSlug, nextPage);
  };

  const handleVote = async (postId: string, value: 1 | -1, currentVote: 1 | -1 | null) => {
    const newValue = currentVote === value ? null : value;
    await vote('post', postId, newValue);
  };

  const handleSubscribe = async (forumId: string, isSubscribed: boolean) => {
    if (isSubscribed) {
      await unsubscribe(forumId);
    } else {
      await subscribe(forumId);
    }
  };

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Gradient Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

      {/* Ambient Particles */}
      <AmbientParticles />

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {/* Forum Header (if viewing specific forum) */}
        {activeForum && (
          <ForumHeader
            forum={{
              id: activeForum.id,
              name: activeForum.name,
              slug: activeForum.slug,
              description: activeForum.description ?? undefined,
              iconUrl: activeForum.iconUrl ?? undefined,
              bannerUrl: activeForum.bannerUrl ?? undefined,
              memberCount: activeForum.memberCount,
              isSubscribed: activeForum.isSubscribed ?? false,
              ownerId: activeForum.ownerId ?? undefined,
              moderators: activeForum.moderators,
              createdAt: activeForum.createdAt ?? '',
            }}
            userId={user?.id}
            onSubscribe={() => handleSubscribe(activeForum.id, activeForum.isSubscribed)}
            onNavigateToAdmin={() => navigate(`/forums/${activeForum.slug}/admin`)}
          />
        )}

        {/* Sort Controls - Glassmorphic */}
        <SortControls
          sortBy={sortBy}
          timeRange={timeRange}
          showSortMenu={showSortMenu}
          showTimeMenu={showTimeMenu}
          isAuthenticated={isAuthenticated}
          onSortChange={setSortBy}
          onTimeRangeChange={setTimeRange}
          onToggleSortMenu={() => setShowSortMenu(!showSortMenu)}
          onToggleTimeMenu={() => setShowTimeMenu(!showTimeMenu)}
          onCloseSortMenu={() => setShowSortMenu(false)}
          onCloseTimeMenu={() => setShowTimeMenu(false)}
          onNavigateToCreateForum={() => navigate('/forums/create')}
        />

        {/* Posts - With staggered animations */}
        <PostsList
          posts={posts}
          isLoading={isLoadingPosts}
          hasMore={hasMorePosts}
          activeForum={activeForum ? { slug: activeForum.slug } : null}
          onVote={handleVote}
          onLoadMore={handleLoadMore}
        />
      </div>

      {/* Sidebar - Glassmorphic */}
      <ForumSidebar
        activeForum={
          activeForum
            ? {
                id: activeForum.id,
                slug: activeForum.slug,
                description: activeForum.description ?? undefined,
                memberCount: activeForum.memberCount,
                createdAt: activeForum.createdAt ?? '',
              }
            : null
        }
        forums={forums as ForumSidebarProps['forums']}
        isLoadingForums={isLoadingForums}
      />
    </div>
  );
}
