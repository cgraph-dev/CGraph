import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  EyeIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { ProfileCard, type ProfileCardUser } from './ProfileCard';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';

/**
 * UserProfileCard Component
 *
 * Discord-style profile popup with hover and click triggers:
 * - Mini variant: Compact card shown on hover (300px)
 * - Full variant: Detailed modal shown on click (600px)
 *
 * Features:
 * - 500ms hover delay for mini card
 * - Click anywhere triggers full card
 * - Portal rendering for z-index management
 * - Animated entrance/exit with Framer Motion
 * - Mutual friends and shared forums display
 */

// ==================== TYPE DEFINITIONS ====================

export interface UserProfileCardProps {
  userId: string;
  user?: ProfileCardUser;
  variant?: 'mini' | 'full';
  trigger?: 'hover' | 'click' | 'both';
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

// ==================== MINI CARD ====================

interface MiniProfileCardProps {
  user: ProfileCardUser;
  onViewProfile: () => void;
  onMessage: () => void;
}

function MiniProfileCard({ user, onViewProfile, onMessage }: MiniProfileCardProps) {
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = user.id === currentUser?.id;

  return (
    <div className="w-[300px] p-4">
      {/* Avatar with border */}
      <div className="flex flex-col items-center mb-3">
        <div className="relative">
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="h-20 w-20 rounded-full object-cover border-2 border-primary-500/50"
          />
          {/* Online indicator */}
          {user.isOnline && (
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-green-500 border-2 border-dark-800" />
          )}
        </div>
      </div>

      {/* Username + Title */}
      <div className="text-center mb-3">
        <h3 className="text-base font-bold text-white truncate">{user.displayName}</h3>
        <p className="text-xs text-white/60">@{user.username}</p>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-center gap-4 mb-3 text-xs">
        <div className="text-center">
          <div className="font-semibold text-white">Level {user.level}</div>
          <div className="text-white/60">XP</div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-center">
          <div className="font-semibold text-white">{user.isOnline ? 'Online' : 'Offline'}</div>
          <div className="text-white/60">Status</div>
        </div>
      </div>

      {/* Mutual Friends */}
      {user.mutualFriends && user.mutualFriends.length > 0 && (
        <div className="mb-3 text-xs text-center">
          <span className="text-white/60">
            {user.mutualFriends.length} mutual friend{user.mutualFriends.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {!isOwnProfile && (
        <div className="flex gap-2">
          <button
            onClick={onMessage}
            className="flex-1 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            Message
          </button>
          <button
            onClick={onViewProfile}
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            View Profile
          </button>
        </div>
      )}

      {isOwnProfile && (
        <button
          onClick={onViewProfile}
          className="w-full px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          View Profile
        </button>
      )}
    </div>
  );
}

// ==================== FULL CARD ====================

interface FullProfileCardProps {
  user: ProfileCardUser;
  mutualFriends: any[];
  onClose: () => void;
}

function FullProfileCard({ user, mutualFriends, onClose }: FullProfileCardProps) {
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = user.id === currentUser?.id;

  return (
    <div className="w-[600px] max-h-[80vh] overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      {/* Banner Background */}
      <div className="h-32 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-pink-500/20 rounded-t-2xl" />

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="flex items-start gap-4 -mt-12 mb-4">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-24 w-24 rounded-full object-cover border-4 border-dark-800"
            />
            {user.isOnline && (
              <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-dark-800" />
            )}
          </div>

          <div className="flex-1 mt-12">
            <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
            <p className="text-sm text-white/60">@{user.username}</p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-4 p-3 rounded-lg bg-white/5">
            <p className="text-sm text-white/80">{user.bio}</p>
          </div>
        )}

        {/* Top Badges */}
        {user.equippedBadges && user.equippedBadges.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white/70 mb-2">Equipped Badges</h3>
            <div className="flex gap-2">
              {user.equippedBadges.slice(0, 3).map((badge) => (
                <div
                  key={badge.id}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-xs font-medium text-yellow-400"
                >
                  {badge.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-bold text-white">{user.karma.toLocaleString()}</div>
            <div className="text-xs text-white/60">Karma</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-bold text-white">{user.streak}</div>
            <div className="text-xs text-white/60">Streak</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-bold text-white">{user.postCount || 0}</div>
            <div className="text-xs text-white/60">Posts</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-bold text-white">{user.friendCount || 0}</div>
            <div className="text-xs text-white/60">Friends</div>
          </div>
        </div>

        {/* Mutual Friends */}
        {mutualFriends.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white/70 mb-2">Mutual Friends</h3>
            <div className="flex -space-x-2">
              {mutualFriends.slice(0, 5).map((friend) => (
                <img
                  key={friend.id}
                  src={friend.avatarUrl}
                  alt={friend.username}
                  className="h-8 w-8 rounded-full border-2 border-dark-800"
                  title={friend.username}
                />
              ))}
              {mutualFriends.length > 5 && (
                <div className="h-8 w-8 rounded-full border-2 border-dark-800 bg-white/10 flex items-center justify-center text-xs text-white">
                  +{mutualFriends.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shared Forums */}
        {user.forumsInCommon && user.forumsInCommon.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white/70 mb-2">Shared Forums</h3>
            <div className="flex flex-wrap gap-2">
              {user.forumsInCommon.slice(0, 3).map((forum) => (
                <span key={forum.id} className="text-xs px-2 py-1 rounded bg-white/5 text-white/60">
                  {forum.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {!isOwnProfile && (
            <>
              <Link
                to={`/messages?userId=${user.id}`}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>Send Message</span>
              </Link>
              <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
                <UserPlusIcon className="h-5 w-5" />
                <span>Add Friend</span>
              </button>
            </>
          )}

          <Link
            to={`/user/${user.id}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors col-span-2"
          >
            <EyeIcon className="h-5 w-5" />
            <span>View Full Profile</span>
          </Link>

          {!isOwnProfile && (
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium transition-colors col-span-2">
              <ShieldExclamationIcon className="h-5 w-5" />
              <span>Block User</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function UserProfileCard({
  userId,
  user,
  variant = 'mini',
  trigger = 'click',
  onClose,
  children,
  className = '',
}: UserProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cardVariant, setCardVariant] = useState<'mini' | 'full'>(variant);
  const hoverTimeout = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const { mutualFriends } = useFriendStore();

  // Calculate card position relative to trigger element
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    if ((trigger === 'hover' || trigger === 'both') && variant === 'mini') {
      hoverTimeout.current = setTimeout(() => {
        setCardVariant('mini');
        setIsOpen(true);
      }, 500); // 500ms hover delay
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    if (cardVariant === 'mini' && trigger === 'hover') {
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' || trigger === 'both') {
      setCardVariant('full');
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleViewProfile = () => {
    window.location.href = `/user/${userId}`;
  };

  const handleMessage = () => {
    window.location.href = `/messages?userId=${userId}`;
  };

  // If no user data provided, use a placeholder
  const profileUser: ProfileCardUser = user || {
    id: userId,
    username: 'Loading...',
    displayName: 'Loading...',
    avatarUrl: '',
    level: 0,
    xp: 0,
    xpToNextLevel: 100,
    karma: 0,
    streak: 0,
    isOnline: false,
  };

  return (
    <>
      {/* Trigger element */}
      <div
        ref={triggerRef}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {/* Card Portal */}
      {isOpen &&
        createPortal(
          <>
            {/* Backdrop for full variant */}
            {cardVariant === 'full' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
            )}

            {/* Card */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`fixed z-50 ${
                  cardVariant === 'mini'
                    ? 'pointer-events-auto'
                    : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                }`}
                style={
                  cardVariant === 'mini'
                    ? {
                        top: position.top,
                        left: position.left,
                        transform: 'translateX(-50%)',
                      }
                    : undefined
                }
                onMouseEnter={cardVariant === 'mini' ? handleMouseEnter : undefined}
                onMouseLeave={cardVariant === 'mini' ? handleMouseLeave : undefined}
              >
                <GlassCard variant="holographic" glow glowColor="rgba(139, 92, 246, 0.3)">
                  {cardVariant === 'mini' ? (
                    <MiniProfileCard
                      user={profileUser}
                      onViewProfile={handleViewProfile}
                      onMessage={handleMessage}
                    />
                  ) : (
                    <FullProfileCard
                      user={profileUser}
                      mutualFriends={mutualFriends}
                      onClose={handleClose}
                    />
                  )}
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </>,
          document.body
        )}
    </>
  );
}
