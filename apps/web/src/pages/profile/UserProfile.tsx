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
} from '@heroicons/react/24/outline';
import Dropdown, { DropdownItem } from '@/components/Dropdown';

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
          statusMessage: userData.custom_status,
          isVerified: userData.is_verified,
          isPremium: userData.is_premium,
          createdAt: userData.inserted_at,
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
      <div className="flex-1 flex items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-dark-900 gap-4">
        <p className="text-gray-400">{error || 'User not found'}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-dark-900 overflow-y-auto">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-primary-600 to-purple-600">
        {profile.bannerUrl && (
          <img
            src={profile.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-6 -mt-16 relative">
        <div className="flex items-end gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              src={profile.avatarUrl || undefined}
              alt={profile.displayName || profile.username}
              fallback={(profile.displayName || profile.username).charAt(0).toUpperCase()}
              size="xl"
              className="ring-4 ring-dark-900"
            />
            <div
              className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-dark-900 ${getStatusColor(profile.status)}`}
            />
          </div>

          {/* Name & Actions */}
          <div className="flex-1 flex items-center justify-between pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">
                  {profile.displayName || profile.username}
                </h1>
                {profile.isVerified && (
                  <CheckBadgeIcon className="h-6 w-6 text-primary-500" />
                )}
                {profile.isPremium && (
                  <ShieldCheckIcon className="h-5 w-5 text-yellow-500" />
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
                    <Button
                      variant="secondary"
                      leftIcon={<ChatBubbleLeftIcon className="h-5 w-5" />}
                      onClick={handleMessage}
                    >
                      Message
                    </Button>
                    <Dropdown
                      trigger={
                        <Button variant="ghost">
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </Button>
                      }
                      align="right"
                    >
                      <DropdownItem
                        onClick={handleRemoveFriend}
                        icon={<UserMinusIcon className="h-4 w-4" />}
                        danger
                      >
                        Remove Friend
                      </DropdownItem>
                    </Dropdown>
                  </>
                )}

                {friendshipStatus === 'none' && (
                  <Button
                    leftIcon={<UserPlusIcon className="h-5 w-5" />}
                    onClick={handleSendRequest}
                    isLoading={isActioning}
                  >
                    Add Friend
                  </Button>
                )}

                {friendshipStatus === 'pending_sent' && (
                  <Button variant="secondary" disabled>
                    Request Sent
                  </Button>
                )}

                {friendshipStatus === 'pending_received' && (
                  <Button
                    leftIcon={<UserPlusIcon className="h-5 w-5" />}
                    onClick={handleAcceptRequest}
                    isLoading={isActioning}
                  >
                    Accept Request
                  </Button>
                )}
              </div>
            )}

            {isOwnProfile && (
              <Button
                variant="secondary"
                onClick={() => navigate('/settings/account')}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* About */}
          <div className="md:col-span-2 space-y-6">
            {profile.bio && (
              <div className="bg-dark-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">About</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Activity / Mutual Friends could go here */}
            {profile.mutualFriends !== undefined && profile.mutualFriends > 0 && (
              <div className="bg-dark-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">Mutual Friends</h2>
                <p className="text-gray-400">
                  You have {profile.mutualFriends} mutual friend{profile.mutualFriends !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-dark-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-gray-400">
                <CalendarDaysIcon className="h-5 w-5" />
                <span>
                  Joined{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {profile.location && (
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPinIcon className="h-5 w-5" />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.website && (
                <div className="flex items-center gap-3 text-gray-400">
                  <LinkIcon className="h-5 w-5" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:underline"
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
