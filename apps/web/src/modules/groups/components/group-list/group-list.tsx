/**
 * Group listing component with search.
 * @module
 */
import { useState, useMemo } from 'react';
import { Plus, Search, LayoutGrid, List, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import { GroupIcon } from './group-icon';
import { GroupCard } from './group-card';
import { GroupListItem } from './group-list-item';
import { CreateGroupModal } from './create-group-modal';
import type { GroupListProps, GroupListVariant } from './types';

export function GroupList({
  variant = 'grid',
  showSearch = true,
  showCreateButton = true,
}: GroupListProps) {
  const navigate = useNavigate();
  const { groups, isLoading, create } = useGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentVariant, setCurrentVariant] = useState<GroupListVariant>(variant);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter(
      (g) => g.name.toLowerCase().includes(query) || g.description?.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  const handleGroupClick = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  const handleCreateGroup = async (data: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => {
    await create(data.name, data.description, data.isPublic);
    setShowCreateModal(false);
  };

  // Sidebar variant - compact icons only
  if (currentVariant === 'sidebar') {
    return (
      <div className="flex flex-col gap-2 p-2">
        {filteredGroups.slice(0, 8).map((group) => (
          <GroupIcon
            key={group.id}
            group={group}
            isActive={false}
            onClick={() => handleGroupClick(group.id)}
          />
        ))}
        {showCreateButton && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-700 text-gray-400 transition-colors hover:bg-dark-600 hover:text-white"
            title="Create Group"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGroup}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with search and controls */}
      {(showSearch || showCreateButton) && (
        <div className="flex items-center gap-4">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="focus:border-brand-500 w-full rounded-lg border border-dark-600 bg-dark-700 py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentVariant('grid')}
              className={`rounded-lg p-2 transition-colors ${
                currentVariant === 'grid'
                  ? 'bg-brand-500 text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentVariant('list')}
              className={`rounded-lg p-2 transition-colors ${
                currentVariant === 'list'
                  ? 'bg-brand-500 text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {showCreateButton && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Group</span>
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="border-brand-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="mb-4 h-12 w-12 text-gray-500" />
          <h3 className="mb-2 text-lg font-medium text-white">No groups found</h3>
          <p className="mb-4 text-gray-400">
            {searchQuery ? 'Try a different search term' : 'Create your first group to get started'}
          </p>
          {showCreateButton && !searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Group</span>
            </button>
          )}
        </div>
      )}

      {/* Grid view */}
      {!isLoading && currentVariant === 'grid' && filteredGroups.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} onClick={() => handleGroupClick(group.id)} />
          ))}
        </div>
      )}

      {/* List view */}
      {!isLoading && currentVariant === 'list' && filteredGroups.length > 0 && (
        <div className="flex flex-col gap-2">
          {filteredGroups.map((group) => (
            <GroupListItem
              key={group.id}
              group={group}
              onClick={() => handleGroupClick(group.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}
