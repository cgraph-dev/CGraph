import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchStore, SearchCategory } from '@/stores/searchStore';
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

const categories: { id: SearchCategory; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: MagnifyingGlassIcon },
  { id: 'users', label: 'Users', icon: UserIcon },
  { id: 'groups', label: 'Groups', icon: UserGroupIcon },
  { id: 'forums', label: 'Forums', icon: NewspaperIcon },
  { id: 'posts', label: 'Posts', icon: DocumentTextIcon },
  { id: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-dark-700 px-6 py-4">
        <h1 className="text-xl font-semibold mb-4">Search</h1>

        {/* Main Search Input */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search users, groups, forums, posts..."
            className="w-full pl-12 pr-12 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ID Search */}
      <div className="px-6 py-4 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <select
            value={idSearchType}
            onChange={(e) => setIdSearchType(e.target.value as 'user' | 'group' | 'forum')}
            className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleIdSearch}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            Go
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MagnifyingGlassIcon className="h-16 w-16 text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Search CGraph</h3>
            <p className="text-gray-400 max-w-md">
              Find users, groups, forums, posts, and messages. You can also search by ID using the quick search above.
            </p>
          </div>
        )}

        {!isLoading && hasSearched && totalResults === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MagnifyingGlassIcon className="h-16 w-16 text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
            <p className="text-gray-400">
              Try different keywords or search in a specific category
            </p>
          </div>
        )}

        {!isLoading && hasSearched && totalResults > 0 && (
          <div className="space-y-6">
            {/* Users */}
            {(category === 'all' || category === 'users') && users.length > 0 && (
              <ResultSection
                title="Users"
                count={users.length}
                onViewAll={() => handleCategoryChange('users')}
                showViewAll={category === 'all' && users.length > 3}
              >
                {(category === 'all' ? users.slice(0, 3) : users).map((user) => (
                  <UserResult key={user.id} user={user} onClick={() => navigate(`/friends?userId=${user.id}`)} />
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
                {(category === 'all' ? groups.slice(0, 3) : groups).map((group) => (
                  <GroupResult key={group.id} group={group} onClick={() => navigate(`/groups/${group.id}`)} />
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
                {(category === 'all' ? forums.slice(0, 3) : forums).map((forum) => (
                  <ForumResult key={forum.id} forum={forum} onClick={() => navigate(`/forums/${forum.slug}`)} />
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
                {(category === 'all' ? posts.slice(0, 3) : posts).map((post) => (
                  <PostResult key={post.id} post={post} onClick={() => navigate(`/forums/${post.forumSlug}/post/${post.id}`)} />
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
                {(category === 'all' ? messages.slice(0, 3) : messages).map((message) => (
                  <MessageResult key={message.id} message={message} onClick={() => navigate(`/messages/${message.conversationId}`)} />
                ))}
              </ResultSection>
            )}
          </div>
        )}
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
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {title} <span className="text-gray-500">({count})</span>
        </h3>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary-400 hover:text-primary-300 font-medium"
          >
            View all
          </button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// User Result Component
interface UserResultProps {
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null; status: string };
  onClick: () => void;
}

function UserResult({ user, onClick }: UserResultProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors text-left"
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.username} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
          {user.username.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <p className="font-medium text-white">{user.displayName || user.username}</p>
        <p className="text-sm text-gray-400">@{user.username}</p>
      </div>
    </button>
  );
}

// Group Result Component
interface GroupResultProps {
  group: { id: string; name: string; description: string | null; iconUrl: string | null; memberCount: number };
  onClick: () => void;
}

function GroupResult({ group, onClick }: GroupResultProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors text-left"
    >
      {group.iconUrl ? (
        <img src={group.iconUrl} alt={group.name} className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-secondary-600 flex items-center justify-center text-white font-medium">
          {group.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{group.name}</p>
        <p className="text-sm text-gray-400">{group.memberCount} members</p>
      </div>
    </button>
  );
}

// Forum Result Component
interface ForumResultProps {
  forum: { id: string; name: string; slug: string; description: string | null; iconUrl: string | null; postCount: number };
  onClick: () => void;
}

function ForumResult({ forum, onClick }: ForumResultProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors text-left"
    >
      {forum.iconUrl ? (
        <img src={forum.iconUrl} alt={forum.name} className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center text-white font-medium">
          {forum.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{forum.name}</p>
        <p className="text-sm text-gray-400">{forum.postCount} posts</p>
      </div>
    </button>
  );
}

// Post Result Component
interface PostResultProps {
  post: { id: string; title: string; content: string; author: { username: string }; forumSlug: string };
  onClick: () => void;
}

function PostResult({ post, onClick }: PostResultProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors text-left"
    >
      <p className="font-medium text-white line-clamp-1">{post.title}</p>
      <p className="text-sm text-gray-400 line-clamp-2 mt-1">{post.content}</p>
      <p className="text-xs text-gray-500 mt-2">by @{post.author.username} in r/{post.forumSlug}</p>
    </button>
  );
}

// Message Result Component
interface MessageResultProps {
  message: { id: string; content: string; sender: { username: string }; conversationId: string };
  onClick: () => void;
}

function MessageResult({ message, onClick }: MessageResultProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors text-left"
    >
      <p className="text-sm text-gray-400 line-clamp-2">{message.content}</p>
      <p className="text-xs text-gray-500 mt-2">from @{message.sender.username}</p>
    </button>
  );
}
