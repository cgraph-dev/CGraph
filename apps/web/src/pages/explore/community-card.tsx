/**
 * Community Card Component
 *
 * Renders a card for a discoverable community (group or forum)
 * in the explore page grid. Shows avatar, name, description,
 * member count, type badge, and category tag.
 *
 * @module pages/explore/community-card
 */

import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export interface Community {
  id: string;
  type: 'group' | 'forum';
  name: string;
  description: string | null;
  member_count: number;
  avatar_url: string | null;
  category: string | null;
  created_at: string;
  is_verified: boolean;
}

interface CommunityCardProps {
  community: Community;
}

/**
 * A card component displaying a community (group or forum) for the explore page.
 */
export default function CommunityCard({ community }: CommunityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (community.type === 'group') {
      navigate(`/groups/${community.id}`);
    } else {
      navigate(`/forums/${community.id}`);
    }
  };

  const TypeIcon = community.type === 'group' ? UserGroupIcon : ChatBubbleLeftRightIcon;
  const typeLabel = community.type === 'group' ? 'Group' : 'Forum';
  const typeColor =
    community.type === 'group'
      ? 'bg-blue-500/20 text-blue-400'
      : 'bg-emerald-500/20 text-emerald-400';

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-all hover:border-primary-500/30 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-primary-500/5"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Header — avatar + name + type */}
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 text-lg font-bold text-white">
          {community.avatar_url ? (
            <img
              src={community.avatar_url}
              alt={community.name}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            community.name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-white group-hover:text-primary-400 transition-colors">
              {community.name}
            </h3>
            {community.is_verified && (
              <span className="text-primary-400" title="Verified">
                ✓
              </span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-2 text-xs text-white/40">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColor}`}>
              <TypeIcon className="h-3 w-3" />
              {typeLabel}
            </span>
            <span className="flex items-center gap-1">
              <UserGroupIcon className="h-3 w-3" />
              {community.member_count.toLocaleString()}{' '}
              {community.member_count === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {community.description && (
        <p className="mb-3 line-clamp-2 text-sm text-white/60">{community.description}</p>
      )}

      {/* Footer — category + action */}
      <div className="flex items-center justify-between">
        {community.category ? (
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/50">
            {community.category}
          </span>
        ) : (
          <span />
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-500"
        >
          View
        </button>
      </div>
    </div>
  );
}
