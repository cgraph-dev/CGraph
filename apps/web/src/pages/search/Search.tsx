import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchStore, SearchCategory } from '@/stores/searchStore';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  MagnifyingGlassIcon,
  UserIcon,
  UserGroupIcon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';

const categories = [
  { id: 'all' as const, label: 'All', icon: MagnifyingGlassIcon },
  { id: 'users' as const, label: 'Users', icon: UserIcon },
  { id: 'groups' as const, label: 'Groups', icon: UserGroupIcon },
  { id: 'forums' as const, label: 'Forums', icon: NewspaperIcon },
  { id: 'posts' as const, label: 'Posts', icon: DocumentTextIcon },
  { id: 'messages' as const, label: 'Messages', icon: ChatBubbleLeftRightIcon },
];

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [idSearchValue, setIdSearchValue] = useState('');
  const [idSearchType, setIdSearchType] = useState<'user' | 'group' | 'forum'>('user');

  const {
    query,
    category,
    users,
    groups,
    forums,
    posts,
    messages,
    isLoading,
    hasSearched,
    setQuery,
    setCategory,
    search,
    searchById,
    clearResults,
  } = useSearchStore();

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((q: string) => {
      if (q.trim()) {
        search(q);
        setSearchParams({ q, category });
      }
    }, 300),
    [category]
  );

  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category') as SearchCategory;

    if (q) {
      setInputValue(q);
      setQuery(q);
      if (cat && categories.find(c => c.id === cat)) {
        setCategory(cat);
      }
      search(q);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setQuery(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (cat: SearchCategory) => {
    setCategory(cat);
    if (query.trim()) {
      search();
      setSearchParams({ q: query, category: cat });
    }
  };

  const handleClear = () => {
    setInputValue('');
    clearResults();
    setSearchParams({});
  };

  const handleIdSearch = async () => {
    if (!idSearchValue.trim()) return;

    const result = await searchById(idSearchType, idSearchValue.trim());
    if (result) {
      switch (idSearchType) {
        case 'user':
          navigate(`/friends?userId=${idSearchValue}`);
          break;
        case 'group':
          navigate(`/groups/${idSearchValue}`);
          break;
        case 'forum':
          navigate(`/forums/${idSearchValue}`);
          break;
      }
    } else {
      alert(`${idSearchType} not found`);
    }
  };

  const totalResults =
    users.length + groups.length + forums.length + posts.length + messages.length;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
      {/* Ambient particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Header */}
      <div className="border-b border-primary-500/20 px-6 py-4 bg-dark-900/50 backdrop-blur-xl relative z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-4 flex items-center gap-2">
            <MagnifyingGlassIcon className="h-6 w-6 text-primary-400" />
            Search
          </h1>

          {/* Main Search Input */}
          <motion.div
            className="relative mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <GlassCard variant="crystal" className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400 z-10 pointer-events-none" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search users, groups, forums, posts..."
                className="w-full pl-12 pr-12 py-3 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none relative z-10"
              />
              <AnimatePresence>
                {inputValue && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      handleClear();
                      HapticFeedback.light();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white z-10"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            className="flex items-center gap-2 overflow-x-auto pb-2 relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => {
                    handleCategoryChange(cat.id);
                    HapticFeedback.light();
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: 0.25 + index * 0.05,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    category === cat.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {category === cat.id && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent rounded-lg"
                      style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{cat.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* ID Search */}
      <div className="px-6 py-4 border-b border-primary-500/20 bg-dark-900/30 backdrop-blur-sm relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <GlassCard variant="default" className="p-4">
            <div className="flex items-center gap-3">
              <select
                value={idSearchType}
                onChange={(e) => setIdSearchType(e.target.value as 'user' | 'group' | 'forum')}
                className="px-3 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 backdrop-blur-sm"
              >
                <option value="user">User ID</option>
                <option value="group">Group ID</option>
                <option value="forum">Forum ID</option>
              </select>
              <input
                type="text"
                value={idSearchValue}
                onChange={(e) => setIdSearchValue(e.target.value)}
                placeholder={`Enter ${idSearchType} ID...`}
                className="flex-1 px-4 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 backdrop-blur-sm"
              />
              <motion.button
                onClick={() => {
                  handleIdSearch();
                  HapticFeedback.medium();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
              >
                Go
                <ArrowRightIcon className="h-4 w-4" />
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="relative">
                <motion.div
                  className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary-400/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          )}

          {!isLoading && !hasSearched && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <motion.div
                    className="relative mb-4"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="p-4 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full">
                      <MagnifyingGlassIcon className="h-16 w-16 text-primary-400" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary-500/30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </motion.div>
                  <h3 className="text-lg font-medium bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-2">
                    Search CGraph
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Find users, groups, forums, posts, and messages. You can also search by ID using the quick search above.
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {!isLoading && hasSearched && totalResults === 0 && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GlassCard variant="holographic" className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <MagnifyingGlassIcon className="h-16 w-16 text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-400">
                    Try different keywords or search in a specific category
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {!isLoading && hasSearched && totalResults > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Users */}
              {(category === 'all' || category === 'users') && users.length > 0 && (
                <ResultSection
                  title="Users"
                  count={users.length}
                  onViewAll={() => handleCategoryChange('users')}
                  showViewAll={category === 'all' && users.length > 3}
                >
                  {(category === 'all' ? users.slice(0, 3) : users).map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                        delay: index * 0.05,
                      }}
                    >
                      <UserResult user={user} onClick={() => navigate(`/friends?userId=${user.id}`)} />
                    </motion.div>
                  ))}
                </ResultSection>
              )}

              {/* Groups */}
              {(category === 'all' || category === 'groups') && groups.length > 0 && (
                <ResultSection
                  title="Groups"
                  count={groups.length}
                  onViewAll={() => handleCategoryChange('groups')}
                  showViewAll={category === 'all' && groups.length > 3}
                >
                  {(category === 'all' ? groups.slice(0, 3) : groups).map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                        delay: index * 0.05,
                      }}
                    >
                      <GroupResult group={group} onClick={() => navigate(`/groups/${group.id}`)} />
                    </motion.div>
                  ))}
                </ResultSection>
              )}

              {/* Forums */}
              {(category === 'all' || category === 'forums') && forums.length > 0 && (
                <ResultSection
                  title="Forums"
                  count={forums.length}
                  onViewAll={() => handleCategoryChange('forums')}
                  showViewAll={category === 'all' && forums.length > 3}
                >
                  {(category === 'all' ? forums.slice(0, 3) : forums).map((forum, index) => (
                    <motion.div
                      key={forum.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                        delay: index * 0.05,
                      }}
                    >
                      <ForumResult forum={forum} onClick={() => navigate(`/forums/${forum.slug}`)} />
                    </motion.div>
                  ))}
                </ResultSection>
              )}

              {/* Posts */}
              {(category === 'all' || category === 'posts') && posts.length > 0 && (
                <ResultSection
                  title="Posts"
                  count={posts.length}
                  onViewAll={() => handleCategoryChange('posts')}
                  showViewAll={category === 'all' && posts.length > 3}
                >
                  {(category === 'all' ? posts.slice(0, 3) : posts).map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                        delay: index * 0.05,
                      }}
                    >
                      <PostResult post={post} onClick={() => navigate(`/forums/${post.forumSlug}/post/${post.id}`)} />
                    </motion.div>
                  ))}
                </ResultSection>
              )}

              {/* Messages */}
              {(category === 'all' || category === 'messages') && messages.length > 0 && (
                <ResultSection
                  title="Messages"
                  count={messages.length}
                  onViewAll={() => handleCategoryChange('messages')}
                  showViewAll={category === 'all' && messages.length > 3}
                >
                  {(category === 'all' ? messages.slice(0, 3) : messages).map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                        delay: index * 0.05,
                      }}
                    >
                      <MessageResult message={message} onClick={() => navigate(`/messages/${message.conversationId}`)} />
                    </motion.div>
                  ))}
                </ResultSection>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Result Section Component
interface ResultSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  onViewAll?: () => void;
  showViewAll?: boolean;
}

function ResultSection({ title, count, children, onViewAll, showViewAll }: ResultSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">
          {title} <span className="text-gray-500">({count})</span>
        </h3>
        {showViewAll && onViewAll && (
          <motion.button
            onClick={() => {
              onViewAll();
              HapticFeedback.light();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm text-primary-400 hover:text-primary-300 font-medium"
          >
            View all →
          </motion.button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// User Result Component
interface UserResultProps {
  user: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null; status: string };
  onClick: () => void;
}

function UserResult({ user, onClick }: UserResultProps) {
  const displayName = user.displayName || user.username || 'Unknown User';
  const handle = user.username || user.id.slice(0, 8);
  const initial = (displayName).charAt(0).toUpperCase();

  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.3 }}
        />
        <div className="flex items-center gap-3 p-3 text-left relative z-10">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            {user.avatarUrl ? (
              <div className="p-0.5 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full">
                <img src={user.avatarUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-medium">
                {initial}
              </div>
            )}
          </motion.div>
          <div>
            <p className="font-medium bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">{displayName}</p>
            <p className="text-sm text-gray-400">@{handle}</p>
          </div>
        </div>
      </GlassCard>
    </motion.button>
  );
}

// Group Result Component
interface GroupResultProps {
  group: { id: string; name: string; description: string | null; iconUrl: string | null; memberCount: number };
  onClick: () => void;
}

function GroupResult({ group, onClick }: GroupResultProps) {
  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.3 }}
        />
        <div className="flex items-center gap-3 p-3 text-left relative z-10">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            {group.iconUrl ? (
              <img src={group.iconUrl} alt={group.name} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary-600 to-secondary-700 flex items-center justify-center text-white font-medium">
                {group.name.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-medium bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent truncate">{group.name}</p>
            <p className="text-sm text-gray-400">{group.memberCount} members</p>
          </div>
        </div>
      </GlassCard>
    </motion.button>
  );
}

// Forum Result Component
interface ForumResultProps {
  forum: { id: string; name: string; slug: string; description: string | null; iconUrl: string | null; postCount: number };
  onClick: () => void;
}

function ForumResult({ forum, onClick }: ForumResultProps) {
  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.3 }}
        />
        <div className="flex items-center gap-3 p-3 text-left relative z-10">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            {forum.iconUrl ? (
              <img src={forum.iconUrl} alt={forum.name} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-medium">
                {forum.name.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-medium bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent truncate">{forum.name}</p>
            <p className="text-sm text-gray-400">{forum.postCount} posts</p>
          </div>
        </div>
      </GlassCard>
    </motion.button>
  );
}

// Post Result Component
interface PostResultProps {
  post: { id: string; title: string; content: string; author: { username: string | null }; forumSlug: string };
  onClick: () => void;
}

function PostResult({ post, onClick }: PostResultProps) {
  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.3 }}
        />
        <div className="p-3 text-left relative z-10">
          <p className="font-medium bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent line-clamp-1">{post.title}</p>
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">{post.content}</p>
          <p className="text-xs text-gray-500 mt-2">by @{post.author.username || 'unknown'} in c/{post.forumSlug}</p>
        </div>
      </GlassCard>
    </motion.button>
  );
}

// Message Result Component
interface MessageResultProps {
  message: { id: string; content: string; sender: { username: string | null }; conversationId: string };
  onClick: () => void;
}

function MessageResult({ message, onClick }: MessageResultProps) {
  return (
    <motion.button
      onClick={() => {
        onClick();
        HapticFeedback.light();
      }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <GlassCard variant="default" className="group relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.3 }}
        />
        <div className="p-3 text-left relative z-10">
          <p className="text-sm text-gray-300 line-clamp-2">{message.content}</p>
          <p className="text-xs text-gray-500 mt-2">from @{message.sender.username || 'unknown'}</p>
        </div>
      </GlassCard>
    </motion.button>
  );
}
