import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { Button } from '@/components';
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
  TrophyIcon,
  SparklesIcon,
  StarIcon,
  BoltIcon,
  ChartBarIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import Dropdown, { DropdownItem } from '@/components/Dropdown';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import AnimatedAvatar from '@/components/ui/AnimatedAvatar';
import LevelProgress from '@/components/gamification/LevelProgress';
import { TitleBadge } from '@/components/gamification/TitleBadge';
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements';

interface UserProfileData {
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
  // Gamification stats
  level?: number;
  totalXP?: number;
  currentXP?: number;
  loginStreak?: number;
  achievementCount?: number;
  totalAchievements?: number;
  messagesSent?: number;
  postsCreated?: number;
  friendsCount?: number;
  // Title system
  equippedTitle?: string | null;
}

// Default rarity color for fallback
const defaultRarityColor = { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' };

// Rarity color mapping
const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' },
  uncommon: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  mythic: { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-400' },
};

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { sendRequest, acceptRequest, removeFriend } = useFriendStore();
  const { achievements, equippedBadges, level: myLevel, totalXP: myTotalXP, loginStreak: myStreak } = useGamificationStore();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
  const [isActioning, setIsActioning] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === userId;

  // File upload handler for avatar/banner
  const handleFileUpload = useCallback(async (file: File, type: 'avatar' | 'banner') => {
    if (!profile || !isOwnProfile) return;
    
    const setUploading = type === 'avatar' ? setIsUploadingAvatar : setIsUploadingBanner;
    setUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // Upload the file
      const uploadResponse = await api.post('/api/v1/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const uploadedUrl = uploadResponse.data.url;
      
      // Update user profile with the new URL
      const updateField = type === 'avatar' ? 'avatar_url' : 'banner_url';
      await api.patch(`/api/v1/users/${profile.id}`, {
        user: {
          [updateField]: uploadedUrl,
        },
      });
      
      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: uploadedUrl,
      } : null);
      
      HapticFeedback.success();
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
      HapticFeedback.error();
    } finally {
      setUploading(false);
    }
  }, [profile, isOwnProfile]);

  // Handle file input change for avatar
  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image must be less than 5MB');
        return;
      }
      handleFileUpload(file, 'avatar');
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFileUpload]);

  // Handle file input change for banner
  const handleBannerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for banners
        alert('Image must be less than 10MB');
        return;
      }
      handleFileUpload(file, 'banner');
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFileUpload]);

  // Initialize edited bio when profile loads
  useEffect(() => {
    if (profile?.bio) {
      setEditedBio(profile.bio);
    }
  }, [profile?.bio]);

  // Calculate unlocked achievements for display
  const unlockedAchievements = useMemo(() => {
    if (!isOwnProfile) return [];
    return achievements.filter(a => a.unlocked).slice(0, showAllAchievements ? undefined : 6);
  }, [achievements, isOwnProfile, showAllAchievements]);

  const totalUnlocked = useMemo(() => achievements.filter(a => a.unlocked).length, [achievements]);

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
          // Gamification stats (from API or own data if own profile)
          level: userData.level || (isOwnProfile ? myLevel : 1),
          totalXP: userData.total_xp || (isOwnProfile ? myTotalXP : 0),
          currentXP: userData.current_xp || 0,
          loginStreak: userData.login_streak || (isOwnProfile ? myStreak : 0),
          achievementCount: userData.achievement_count || (isOwnProfile ? totalUnlocked : 0),
          totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
          messagesSent: userData.messages_sent || 0,
          postsCreated: userData.posts_created || 0,
          friendsCount: userData.friends_count || 0,
          // Title system - equipped title ID
          equippedTitle: userData.equipped_title || userData.title_id || null,
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
  }, [userId, isOwnProfile, myLevel, myTotalXP, myStreak, totalUnlocked]);

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

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await api.patch(`/api/v1/users/${profile.id}`, {
        bio: editedBio,
      });
      setProfile({ ...profile, bio: editedBio });
      setEditMode(false);
      HapticFeedback.success();
    } catch (error) {
      console.error('Failed to update profile:', error);
      HapticFeedback.error();
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedBio(profile?.bio || '');
    setEditMode(false);
    HapticFeedback.light();
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
        className="relative h-48 bg-gradient-to-r from-primary-600 to-purple-600 overflow-hidden group"
      >
        {profile.bannerUrl && (
          <img
            src={profile.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-950/50 pointer-events-none" />

        {/* Edit Mode Toggle - Top Right */}
        {isOwnProfile && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {editMode ? (
              <>
                <motion.button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-lg bg-dark-700/90 hover:bg-dark-600 backdrop-blur-sm border border-white/10 text-white font-medium flex items-center gap-2 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveProfile}
                  disabled={isActioning}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 backdrop-blur-sm text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CheckIcon className="h-4 w-4" />
                  {isActioning ? 'Saving...' : 'Save'}
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={() => {
                  setEditMode(true);
                  HapticFeedback.medium();
                }}
                className="px-4 py-2 rounded-lg bg-dark-700/90 hover:bg-dark-600 backdrop-blur-sm border border-white/10 text-white font-medium flex items-center gap-2 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit Profile
              </motion.button>
            )}
          </div>
        )}

        {/* Banner Edit Overlay */}
        {isOwnProfile && editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-dark-900/70 transition-colors"
            onClick={() => {
              bannerInputRef.current?.click();
              HapticFeedback.medium();
            }}
          >
            <div className="text-center">
              {isUploadingBanner ? (
                <>
                  <div className="h-12 w-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-white font-medium">Uploading...</p>
                </>
              ) : (
                <>
                  <PhotoIcon className="h-12 w-12 text-white mx-auto mb-2" />
                  <p className="text-white font-medium">Change Banner</p>
                  <p className="text-sm text-gray-300 mt-1">Click to upload</p>
                </>
              )}
            </div>
          </motion.div>
        )}
        {/* Hidden file input for banner */}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerChange}
        />
      </motion.div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-end gap-6"
        >
          {/* Avatar with AnimatedAvatar */}
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <AnimatedAvatar
              src={profile.avatarUrl || undefined}
              alt={profile.displayName || profile.username}
              size="2xl"
              showStatus={true}
              statusType={profile.status}
            />

            {/* Avatar Edit Overlay */}
            {isOwnProfile && editMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-dark-900/70 rounded-full backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-dark-900/80 transition-colors"
                onClick={() => {
                  avatarInputRef.current?.click();
                  HapticFeedback.medium();
                }}
              >
                <div className="text-center">
                  {isUploadingAvatar ? (
                    <div className="h-8 w-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <PhotoIcon className="h-8 w-8 text-white mx-auto" />
                  )}
                </div>
              </motion.div>
            )}
            {/* Hidden file input for avatar */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            {/* Level badge overlay */}
            {profile.level && profile.level > 1 && (
              <motion.div
                className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 border-2 border-dark-900 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <span className="text-xs font-bold text-white">Lvl {profile.level}</span>
              </motion.div>
            )}
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
              {/* User Title */}
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-gray-400">@{profile.username}</p>
                {profile.equippedTitle && (
                  <TitleBadge
                    title={profile.equippedTitle}
                    size="xs"
                    showTooltip
                  />
                )}
              </div>
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

            {isOwnProfile && editMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <motion.button
                  onClick={() => navigate('/customize/identity')}
                  className="px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-medium flex items-center gap-2 transition-colors border border-purple-500/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PaintBrushIcon className="h-4 w-4" />
                  Customize
                </motion.button>
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
            {(profile.bio || (isOwnProfile && editMode)) && (
              <GlassCard variant="default" className="p-6">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent mb-3 flex items-center gap-2">
                  About
                  {isOwnProfile && editMode && (
                    <span className="text-xs text-gray-500 font-normal">(Click to edit)</span>
                  )}
                </h2>
                {isOwnProfile && editMode ? (
                  <motion.textarea
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-dark-800/50 border border-primary-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-primary-500 transition-colors"
                    rows={4}
                    maxLength={500}
                  />
                ) : (
                  <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                )}
                {isOwnProfile && editMode && (
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    {editedBio.length} / 500 characters
                  </p>
                )}
              </GlassCard>
            )}

            {/* XP Progress - Show for own profile */}
            {isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <LevelProgress variant="expanded" showStreak={true} />
              </motion.div>
            )}

            {/* Equipped Badges Showcase */}
            {isOwnProfile && equippedBadges.length > 0 && (
              <GlassCard variant="crystal" glow glowColor="rgba(139, 92, 246, 0.3)" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-purple-400" />
                    Equipped Badges
                  </h2>
                  <span className="text-sm text-gray-400">
                    {equippedBadges.length} / 5
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                  <AnimatePresence mode="popLayout">
                    {equippedBadges.map((badgeId, index) => {
                      const badge = achievements.find(a => a.id === badgeId);
                      if (!badge) return null;

                      const colors = rarityColors[badge.rarity] ?? defaultRarityColor;

                      return (
                        <motion.div
                          key={badgeId}
                          initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
                          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                          exit={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                          transition={{
                            delay: index * 0.1,
                            type: 'spring',
                            stiffness: 300,
                            damping: 20
                          }}
                          whileHover={{ scale: 1.1, y: -4 }}
                          className={`relative p-4 rounded-2xl ${colors.bg} border-2 ${colors.border} cursor-pointer group overflow-hidden`}
                          onClick={() => HapticFeedback.medium()}
                        >
                          {/* Glow effect on hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Badge Icon */}
                          <div className="relative z-10 flex flex-col items-center gap-2">
                            <span className="text-4xl drop-shadow-lg">{badge.icon}</span>
                            <div className="text-center">
                              <p className="text-xs font-bold text-white">{badge.title}</p>
                              <p className={`text-[9px] uppercase tracking-wider font-bold ${colors.text} mt-0.5`}>
                                {badge.rarity}
                              </p>
                            </div>
                          </div>

                          {/* Shine effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                              ease: 'linear',
                            }}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {editMode ? (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      navigate('/customize/identity');
                      HapticFeedback.medium();
                    }}
                    className="w-full mt-4 px-4 py-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-medium flex items-center justify-center gap-2 transition-colors border border-purple-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <SparklesIcon className="h-4 w-4" />
                    Manage Badges
                  </motion.button>
                ) : (
                  <p className="text-xs text-center text-gray-500 mt-4">
                    Manage your equipped badges in{' '}
                    <button
                      onClick={() => navigate('/customize/identity')}
                      className="text-purple-400 hover:text-purple-300 font-medium hover:underline"
                    >
                      Customize → Identity
                    </button>
                  </p>
                )}
              </GlassCard>
            )}

            {/* Achievements Showcase */}
            {isOwnProfile && unlockedAchievements.length > 0 && (
              <GlassCard variant="holographic" glow className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-yellow-400" />
                    Achievements
                  </h2>
                  <span className="text-sm text-gray-400">
                    {totalUnlocked} / {ACHIEVEMENT_DEFINITIONS.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <AnimatePresence mode="popLayout">
                    {unlockedAchievements.map((achievement, index) => {
                      const colors = rarityColors[achievement.rarity] ?? defaultRarityColor;
                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className={`p-3 rounded-xl ${colors.bg} border ${colors.border} cursor-pointer group relative overflow-hidden`}
                          onClick={() => HapticFeedback.light()}
                        >
                          <div className="flex items-center gap-2 relative z-10">
                            <span className="text-2xl">{achievement.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{achievement.title}</p>
                              <p className={`text-[10px] uppercase tracking-wider font-bold ${colors.text}`}>
                                {achievement.rarity}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {totalUnlocked > 6 && (
                  <motion.button
                    className="mt-4 w-full py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-sm text-primary-400 font-medium hover:bg-primary-500/30 transition-colors flex items-center justify-center gap-2"
                    onClick={() => {
                      setShowAllAchievements(!showAllAchievements);
                      HapticFeedback.light();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {showAllAchievements ? 'Show Less' : `View All ${totalUnlocked} Achievements`}
                    <SparklesIcon className="h-4 w-4" />
                  </motion.button>
                )}
              </GlassCard>
            )}

            {/* Stats Grid */}
            <GlassCard variant="frosted" className="p-6">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-primary-400" />
                Statistics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <motion.div
                  className="text-center p-4 rounded-xl bg-dark-800/50 border border-primary-500/20"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.5)' }}
                >
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-green-400 bg-clip-text text-transparent">
                    {(profile.level || 1).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <StarIcon className="h-3 w-3" />
                    Level
                  </div>
                </motion.div>

                <motion.div
                  className="text-center p-4 rounded-xl bg-dark-800/50 border border-purple-500/20"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(139, 92, 246, 0.5)' }}
                >
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {(profile.totalXP || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <SparklesIcon className="h-3 w-3" />
                    Total XP
                  </div>
                </motion.div>

                <motion.div
                  className="text-center p-4 rounded-xl bg-dark-800/50 border border-orange-500/20"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(249, 115, 22, 0.5)' }}
                >
                  <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent flex items-center justify-center gap-1">
                    {(profile.loginStreak || 0).toLocaleString()}
                    {(profile.loginStreak || 0) > 0 && <FireIcon className="h-5 w-5 text-orange-400" />}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <BoltIcon className="h-3 w-3" />
                    Day Streak
                  </div>
                </motion.div>

                <motion.div
                  className="text-center p-4 rounded-xl bg-dark-800/50 border border-blue-500/20"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                >
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {(profile.friendsCount || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <UserPlusIcon className="h-3 w-3" />
                    Friends
                  </div>
                </motion.div>
              </div>
            </GlassCard>

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
