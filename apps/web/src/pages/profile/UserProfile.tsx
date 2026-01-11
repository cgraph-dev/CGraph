import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import { Button, Avatar } from '@/components';
import {
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  MapPinIcon,
  LinkIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import Dropdown, { DropdownItem } from '@/components/Dropdown';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  statusMessage: string | null;
  isVerified: boolean;
  isPremium: boolean;
  karma: number;
  createdAt: string;
  mutualFriends?: number;
  location?: string;
  website?: string;
}

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { sendRequest, acceptRequest, removeFriend } = useFriendStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
  const [isActioning, setIsActioning] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await api.get(`/api/v1/users/${userId}`);
        const userData = response.data.user || response.data;
        
        setProfile({
          id: userData.id,
          username: userData.username,
          displayName: userData.display_name,
          avatarUrl: userData.avatar_url,
          bannerUrl: userData.banner_url,
          bio: userData.bio,
          status: userData.status || 'offline',
          statusMessage: userData.custom_status || userData.status_message,
          isVerified: userData.is_verified || false,
          isPremium: userData.is_premium || false,
          karma: userData.karma || 0,
          createdAt: userData.inserted_at || userData.created_at,
          mutualFriends: userData.mutual_friends_count,
          location: userData.location,
          website: userData.website,
        });
        
        setFriendshipStatus(userData.friendship_status || 'none');
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  const handleSendRequest = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await sendRequest(profile.username);
      setFriendshipStatus('pending_sent');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await acceptRequest(profile.id);
      setFriendshipStatus('friends');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await removeFriend(profile.id);
      setFriendshipStatus('none');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleMessage = () => {
    navigate(`/messages?userId=${profile?.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
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
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 gap-4 relative overflow-hidden">
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
        <GlassCard variant="holographic" className="p-8 relative z-10">
          <p className="text-gray-400 mb-4">{error || 'User not found'}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="secondary" onClick={() => {
              navigate(-1);
              HapticFeedback.medium();
            }}>
              Go Back
            </Button>
          </motion.div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 overflow-y-auto relative">
      {/* Ambient particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 pointer-events-none z-0"
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

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative h-48 bg-gradient-to-r from-primary-600 to-purple-600 overflow-hidden"
      >
        {profile.bannerUrl && (
          <img
            src={profile.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-950/50 pointer-events-none" />
      </motion.div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-end gap-6"
        >
          {/* Avatar */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <div className="p-1 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full">
              <Avatar
                src={profile.avatarUrl || undefined}
                alt={profile.displayName || profile.username}
                fallback={(profile.displayName || profile.username).charAt(0).toUpperCase()}
                size="xl"
                className="ring-4 ring-dark-900/50 backdrop-blur-sm"
              />
            </div>
            <motion.div
              className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-dark-900 ${getStatusColor(profile.status)}`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* Name & Actions */}
          <div className="flex-1 flex items-center justify-between pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent">
                  {profile.displayName || profile.username}
                </h1>
                {profile.isVerified && (
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <CheckBadgeIcon className="h-6 w-6 text-primary-500" />
                  </motion.div>
                )}
                {profile.isPremium && (
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <ShieldCheckIcon className="h-5 w-5 text-yellow-500" />
                  </motion.div>
                )}
              </div>
              <p className="text-gray-400">@{profile.username}</p>
              {profile.statusMessage && (
                <p className="text-sm text-gray-500 mt-1">{profile.statusMessage}</p>
              )}
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex items-center gap-3">
                {friendshipStatus === 'friends' && (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="secondary"
                        leftIcon={<ChatBubbleLeftIcon className="h-5 w-5" />}
                        onClick={() => {
                          handleMessage();
                          HapticFeedback.medium();
                        }}
                      >
                        Message
                      </Button>
                    </motion.div>
                    <Dropdown
                      trigger={
                        <Button variant="ghost">
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </Button>
                      }
                      align="right"
                    >
                      <DropdownItem
                        onClick={() => {
                          handleRemoveFriend();
                          HapticFeedback.medium();
                        }}
                        icon={<UserMinusIcon className="h-4 w-4" />}
                        danger
                      >
                        Remove Friend
                      </DropdownItem>
                    </Dropdown>
                  </>
                )}

                {friendshipStatus === 'none' && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      leftIcon={<UserPlusIcon className="h-5 w-5" />}
                      onClick={() => {
                        handleSendRequest();
                        HapticFeedback.success();
                      }}
                      isLoading={isActioning}
                    >
                      Add Friend
                    </Button>
                  </motion.div>
                )}

                {friendshipStatus === 'pending_sent' && (
                  <Button variant="secondary" disabled>
                    Request Sent
                  </Button>
                )}

                {friendshipStatus === 'pending_received' && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      leftIcon={<UserPlusIcon className="h-5 w-5" />}
                      onClick={() => {
                        handleAcceptRequest();
                        HapticFeedback.success();
                      }}
                      isLoading={isActioning}
                    >
                      Accept Request
                    </Button>
                  </motion.div>
                )}
              </div>
            )}

            {isOwnProfile && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigate('/settings/account');
                    HapticFeedback.light();
                  }}
                >
                  Edit Profile
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* About */}
          <div className="md:col-span-2 space-y-6">
            {profile.bio && (
              <GlassCard variant="default" className="p-6">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent mb-3">About</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
              </GlassCard>
            )}

            {/* Activity / Mutual Friends could go here */}
            {profile.mutualFriends !== undefined && profile.mutualFriends > 0 && (
              <GlassCard variant="default" className="p-6">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent mb-3">Mutual Friends</h2>
                <p className="text-gray-400">
                  You have {profile.mutualFriends} mutual friend{profile.mutualFriends !== 1 ? 's' : ''}
                </p>
              </GlassCard>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Karma Card */}
            <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="p-2 bg-primary-500/20 rounded-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <ArrowTrendingUpIcon className="h-6 w-6 text-primary-400" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-400">Karma</p>
                  <motion.p
                    className="text-2xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    {(profile.karma ?? 0).toLocaleString()}
                  </motion.p>
                </div>
              </div>
              {profile.karma > 100 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <FireIcon className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-400">
                    {profile.karma > 10000
                      ? 'Legendary contributor'
                      : profile.karma > 1000
                        ? 'Top contributor'
                        : 'Active contributor'}
                  </span>
                </motion.div>
              )}
            </GlassCard>

            <GlassCard variant="frosted" className="p-6 space-y-4">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-gray-400"
              >
                <CalendarDaysIcon className="h-5 w-5 text-primary-400" />
                <span>
                  Joined{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </motion.div>

              {profile.location && (
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 text-gray-400"
                >
                  <MapPinIcon className="h-5 w-5 text-primary-400" />
                  <span>{profile.location}</span>
                </motion.div>
              )}

              {profile.website && (
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 text-gray-400"
                >
                  <LinkIcon className="h-5 w-5 text-primary-400" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 transition-colors"
                    onClick={() => HapticFeedback.light()}
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </motion.div>
              )}
            </GlassCard>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
