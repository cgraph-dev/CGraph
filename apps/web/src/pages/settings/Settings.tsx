import { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import AppearanceSettingsEnhanced from '@/components/settings/AppearanceSettingsEnhanced';
import ChatBubbleSettings from '@/components/settings/ChatBubbleSettings';
import UICustomizationSettings from '@/components/settings/UICustomizationSettings';
import AvatarSettings from '@/components/settings/AvatarSettings';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

const settingsSections = [
  { id: 'account', label: 'Account', icon: UserIcon },
  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
  { id: 'ui-customization', label: 'UI Customization', icon: AdjustmentsHorizontalIcon },
  { id: 'chat-bubbles', label: 'Chat Bubbles', icon: ChatBubbleLeftRightIcon },
  { id: 'avatar', label: 'Avatar & Profile', icon: UserCircleIcon },
  { id: 'language', label: 'Language', icon: GlobeAltIcon },
  { id: 'sessions', label: 'Sessions', icon: DevicePhoneMobileIcon },
  { id: 'privacy', label: 'Privacy', icon: KeyIcon },
  { id: 'billing', label: 'Billing', icon: CreditCardIcon },
];

export default function Settings() {
  const { section = 'account' } = useParams();

  return (
    <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
      {/* Ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
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

      {/* Sidebar */}
      <nav className="w-56 bg-dark-900/50 backdrop-blur-xl border-r border-primary-500/20 p-4 overflow-y-auto relative z-10">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10"
        >
          <h2 className="text-lg font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary-400" />
            Settings
          </h2>
          <div className="space-y-1">
            {settingsSections.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: 0.05 + index * 0.03,
                }}
              >
                <NavLink
                  to={`/settings/${item.id}`}
                  onClick={() => HapticFeedback.light()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                      isActive || (item.id === 'account' && section === undefined)
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active/Hover background */}
                      {isActive ? (
                        <motion.div
                          layoutId="activeSettingsTab"
                          className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent rounded-lg"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-purple-500/0 to-transparent rounded-lg opacity-0 group-hover:opacity-100 group-hover:from-primary-500/10 group-hover:via-purple-500/10 transition-all duration-300" />
                      )}

                      {/* Icon with glow */}
                      <item.icon
                        className={`h-5 w-5 relative z-10 transition-all duration-200 ${
                          isActive ? 'text-primary-400' : 'group-hover:scale-110'
                        }`}
                        style={
                          isActive
                            ? { filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }
                            : {}
                        }
                      />
                      <span className="relative z-10 font-medium">{item.label}</span>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-gradient-to-b from-primary-400 to-purple-500"
                          layoutId="settingsActiveIndicator"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          style={{
                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 relative z-10">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {section === 'account' && <AccountSettings key="account" />}
            {section === 'security' && <SecuritySettings key="security" />}
            {section === 'notifications' && <NotificationSettings key="notifications" />}
            {section === 'appearance' && <AppearanceSettingsEnhanced key="appearance" />}
            {section === 'ui-customization' && <UICustomizationSettings key="ui-customization" />}
            {section === 'chat-bubbles' && <ChatBubbleSettings key="chat-bubbles" />}
            {section === 'avatar' && <AvatarSettings key="avatar" />}
            {section === 'language' && <LanguageSettings key="language" />}
            {section === 'sessions' && <SessionsSettings key="sessions" />}
            {section === 'privacy' && <PrivacySettings key="privacy" />}
            {section === 'billing' && <BillingSettings key="billing" />}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function AccountSettings() {
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  const canChangeUsername = user?.canChangeUsername ?? true;
  const nextChangeDate = user?.usernameNextChangeAt 
    ? new Date(user.usernameNextChangeAt).toLocaleDateString()
    : null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put('/api/v1/me', {
        display_name: displayName,
      });
      updateUser({ displayName: response.data.data.display_name || response.data.data.displayName });
      toast.success('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!username.trim() || username === user?.username) return;
    
    setIsChangingUsername(true);
    try {
      const response = await api.put('/api/v1/me/username', { username });
      updateUser({ 
        username: response.data.data.username,
        canChangeUsername: false,
        usernameNextChangeAt: response.data.data.username_next_change_at,
      });
      toast.success('Username changed successfully');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to change username';
      toast.error(errorMessage);
    } finally {
      setIsChangingUsername(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-6">Account Settings</h1>

      {/* User ID Badge */}
      <GlassCard
        variant="holographic"
        glow
        glowColor="rgba(16, 185, 129, 0.3)"
        className="mb-8 p-4"
      >
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center ring-4 ring-primary-500/20">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">
                {user?.displayName || user?.username || 'Anonymous User'}
              </span>
              {user?.isVerified && (
                <span className="text-blue-400">✓</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-mono px-2 py-1 rounded bg-dark-700 text-primary-400 border border-primary-800/50">
                {user?.userIdDisplay || '#0000'}
              </span>
              {user?.username && (
                <span className="text-gray-400">@{user.username}</span>
              )}
              {user?.karma !== undefined && user.karma > 0 && (
                <span className="text-amber-400 text-sm">⚡ {(user.karma ?? 0).toLocaleString()} karma</span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Avatar */}
      <GlassCard variant="crystal" glow className="mb-8 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Profile Picture</label>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-dark-700 overflow-hidden ring-2 ring-dark-600 transition-all hover:ring-primary-500">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => HapticFeedback.medium()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-primary-500/20"
            >
              Upload Image
            </motion.button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF. Max 2MB.</p>
          </div>
        </div>
      </GlassCard>

      {/* Username with 14-day cooldown */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Username
          {!canChangeUsername && nextChangeDate && (
            <span className="ml-2 text-xs text-amber-400">
              (Can change after {nextChangeDate})
            </span>
          )}
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            disabled={!canChangeUsername}
            placeholder={user?.username || 'Choose a username'}
            className={`flex-1 px-4 py-3 bg-dark-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              canChangeUsername ? 'border-dark-600' : 'border-dark-600/50 text-gray-500 cursor-not-allowed'
            }`}
          />
          {canChangeUsername && username !== user?.username && username.length >= 3 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handleChangeUsername();
                HapticFeedback.medium();
              }}
              disabled={isChangingUsername}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-primary-500/20"
            >
              {isChangingUsername ? 'Saving...' : 'Change'}
            </motion.button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {canChangeUsername
            ? 'Username can be changed every 14 days. Letters, numbers, and underscores only.'
            : `You changed your username recently. Next change available on ${nextChangeDate}.`
          }
        </p>
      </GlassCard>

      {/* Display Name */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How should we call you?"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
      </GlassCard>

      {/* Email */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
      </GlassCard>

      {/* Wallet */}
      <GlassCard variant="crystal" glow className="mb-8 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Connected Wallet</label>
        {user?.walletAddress ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={user.walletAddress}
              disabled
              className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-gray-400 font-mono text-sm"
            />
            <button className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-all hover:scale-105 active:scale-95">
              Disconnect
            </button>
          </div>
        ) : (
          <button className="px-4 py-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white text-sm font-medium rounded-lg transition-all hover:border-primary-500">
            Connect Wallet
          </button>
        )}
      </GlassCard>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          handleSave();
          HapticFeedback.success();
        }}
        disabled={isSaving}
        className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 text-white font-medium rounded-lg transition-all shadow-lg shadow-primary-500/20"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </motion.div>
  );
}

function SecuritySettings() {
  const { user } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-6">Security</h1>

      {/* Password */}
      <GlassCard variant="default" className="p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Password</h3>
            <p className="text-sm text-gray-400 mt-1">Change your password</p>
          </div>
          <button className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors">
            Change
          </button>
        </div>
      </GlassCard>

      {/* 2FA */}
      <GlassCard variant="default" className="p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-400 mt-1">
              {user?.twoFactorEnabled
                ? 'Two-factor authentication is enabled'
                : 'Add an extra layer of security'}
            </p>
          </div>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              user?.twoFactorEnabled
                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
            }`}
          >
            {user?.twoFactorEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </GlassCard>

      {/* Email Verification */}
      <GlassCard variant="default" className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Email Verification</h3>
            <p className="text-sm text-gray-400 mt-1">
              {user?.emailVerifiedAt ? 'Your email is verified' : 'Verify your email address'}
            </p>
          </div>
          {!user?.emailVerifiedAt && (
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
              Verify
            </button>
          )}
          {user?.emailVerifiedAt && (
            <span className="text-green-400 text-sm">✓ Verified</span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function NotificationSettings() {
  const { settings, updateNotificationSettings, isSaving, fetchSettings } = useSettingsStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [pushState, setPushState] = useState<{ supported: boolean; permission: string; registered: boolean }>({
    supported: false,
    permission: 'default',
    registered: false,
  });

  useEffect(() => {
    fetchSettings().finally(() => setIsLoaded(true));
    // Check web push state
    import('@/services/webPushService').then(async (webPush) => {
      const state = await webPush.getPushState();
      setPushState(state);
    });
  }, [fetchSettings]);

  const handleToggle = useCallback(async (key: keyof typeof settings.notifications, value: boolean) => {
    try {
      await updateNotificationSettings({ [key]: value });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  }, [updateNotificationSettings]);

  // Special handler for push notifications that also handles browser permission
  const handlePushToggle = useCallback(async () => {
    const webPush = await import('@/services/webPushService');
    
    if (!pushState.supported) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    const newValue = !settings.notifications.pushNotifications;
    
    if (newValue) {
      // Enable push notifications
      const result = await webPush.registerForPushNotifications();
      if (result.success) {
        await updateNotificationSettings({ pushNotifications: true });
        setPushState(prev => ({ ...prev, registered: true, permission: 'granted' }));
        toast.success('Push notifications enabled');
      } else {
        toast.error(result.error || 'Failed to enable push notifications');
      }
    } else {
      // Disable push notifications
      await webPush.unregisterFromPushNotifications();
      await updateNotificationSettings({ pushNotifications: false });
      setPushState(prev => ({ ...prev, registered: false }));
      toast.success('Push notifications disabled');
    }
  }, [settings.notifications.pushNotifications, pushState.supported, updateNotificationSettings]);

  const Toggle = ({ settingKey, value }: { settingKey: keyof typeof settings.notifications; value: boolean }) => (
    <button
      onClick={() => handleToggle(settingKey, !value)}
      disabled={isSaving}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        value ? 'bg-primary-600' : 'bg-dark-600'
      } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
          value ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-6">
        Notifications
      </h1>

      <div className="space-y-4">
        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Direct Messages</h3>
              <p className="text-sm text-gray-400">Notify when you receive a message</p>
            </div>
            <Toggle settingKey="notifyMessages" value={settings.notifications.notifyMessages} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Mentions</h3>
              <p className="text-sm text-gray-400">Notify when someone mentions you</p>
            </div>
            <Toggle settingKey="notifyMentions" value={settings.notifications.notifyMentions} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Forum Replies</h3>
              <p className="text-sm text-gray-400">Notify when someone replies to your post</p>
            </div>
            <Toggle settingKey="notifyForumReplies" value={settings.notifications.notifyForumReplies} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Friend Requests</h3>
              <p className="text-sm text-gray-400">Notify when you receive a friend request</p>
            </div>
            <Toggle settingKey="notifyFriendRequests" value={settings.notifications.notifyFriendRequests} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Group Invites</h3>
              <p className="text-sm text-gray-400">Notify when you're invited to a group</p>
            </div>
            <Toggle settingKey="notifyGroupInvites" value={settings.notifications.notifyGroupInvites} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Email Notifications</h3>
              <p className="text-sm text-gray-400">Receive notifications via email</p>
            </div>
            <Toggle settingKey="emailNotifications" value={settings.notifications.emailNotifications} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Push Notifications</h3>
              <p className="text-sm text-gray-400">
                {pushState.supported
                  ? pushState.permission === 'denied'
                    ? 'Blocked - enable in browser settings'
                    : 'Receive push notifications in this browser'
                  : 'Not supported in this browser'
                }
              </p>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={isSaving || !pushState.supported || pushState.permission === 'denied'}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.notifications.pushNotifications && pushState.registered ? 'bg-primary-600' : 'bg-dark-600'
              } ${isSaving || !pushState.supported || pushState.permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notifications.pushNotifications && pushState.registered ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Notification Sound</h3>
              <p className="text-sm text-gray-400">Play a sound for notifications</p>
            </div>
            <Toggle settingKey="notificationSound" value={settings.notifications.notificationSound} />
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}

function LanguageSettings() {
  const { settings, updateLocaleSettings, isSaving } = useSettingsStore();
  const [language, setLanguage] = useState(settings.locale.language);

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    try {
      await updateLocaleSettings({ language: newLanguage });
      toast.success('Language updated');
    } catch {
      setLanguage(settings.locale.language);
      toast.error('Failed to update language');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-6">
        Language & Region
      </h1>

      <GlassCard variant="default" className="mb-6 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Interface Language</label>
        <select 
          value={language}
          onChange={handleLanguageChange}
          disabled={isSaving}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
          <option value="ko">한국어</option>
          <option value="pt">Português</option>
          <option value="ru">Русский</option>
          <option value="ar">العربية</option>
        </select>
      </GlassCard>

      <GlassCard variant="default" className="mb-6 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
        <select 
          value={settings.locale.dateFormat}
          onChange={async (e) => {
            try {
              await updateLocaleSettings({ dateFormat: e.target.value as 'mdy' | 'dmy' | 'ymd' });
              toast.success('Date format updated');
            } catch {
              toast.error('Failed to update date format');
            }
          }}
          disabled={isSaving}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <option value="mdy">MM/DD/YYYY</option>
          <option value="dmy">DD/MM/YYYY</option>
          <option value="ymd">YYYY-MM-DD</option>
        </select>
      </GlassCard>

      <GlassCard variant="default" className="p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">Time Format</label>
        <select 
          value={settings.locale.timeFormat}
          onChange={async (e) => {
            try {
              await updateLocaleSettings({ timeFormat: e.target.value as 'twelve_hour' | 'twenty_four_hour' });
              toast.success('Time format updated');
            } catch {
              toast.error('Failed to update time format');
            }
          }}
          disabled={isSaving}
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <option value="twelve_hour">12-hour (1:30 PM)</option>
          <option value="twenty_four_hour">24-hour (13:30)</option>
        </select>
      </GlassCard>
    </motion.div>
  );
}

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  ipAddress: string;
  browser: string;
}

function SessionsSettings() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/me/sessions');
      const data = response.data?.data || response.data?.sessions || [];
      
      const mappedSessions: Session[] = data.map((s: Record<string, unknown>) => ({
        id: s.id as string,
        device: (s.device as string) || (s.user_agent as string) || 'Unknown Device',
        location: (s.location as string) || (s.ip_location as string) || 'Unknown Location',
        lastActive: formatLastActive(s.last_seen_at as string || s.inserted_at as string),
        current: (s.current as boolean) || false,
        ipAddress: (s.ip_address as string) || '',
        browser: parseBrowser(s.user_agent as string || ''),
      }));
      
      setSessions(mappedSessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = async (sessionId: string) => {
    setIsRevoking(sessionId);
    try {
      await api.delete(`/api/v1/me/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Session revoked');
    } catch {
      toast.error('Failed to revoke session');
    } finally {
      setIsRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    setIsRevoking('all');
    try {
      // Revoke all non-current sessions
      const otherSessions = sessions.filter(s => !s.current);
      await Promise.all(otherSessions.map(s => api.delete(`/api/v1/me/sessions/${s.id}`)));
      setSessions(sessions.filter(s => s.current));
      toast.success('All other sessions revoked');
    } catch {
      toast.error('Failed to revoke sessions');
    } finally {
      setIsRevoking(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-6">
        Active Sessions
      </h1>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <GlassCard variant="default" className="p-6 text-center">
            <p className="text-gray-400">No active sessions found</p>
          </GlassCard>
        ) : (
          sessions.map((session) => (
            <GlassCard key={session.id} variant={session.current ? 'crystal' : 'default'} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <DevicePhoneMobileIcon className={`h-8 w-8 ${session.current ? 'text-primary-400' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="font-medium text-white">
                      {session.browser || session.device}
                      {session.current && (
                        <span className="ml-2 text-xs text-green-400 font-semibold">(Current)</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {session.location} • {session.lastActive}
                    </p>
                    {session.ipAddress && (
                      <p className="text-xs text-gray-500 font-mono">{session.ipAddress}</p>
                    )}
                  </div>
                </div>
                {!session.current && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => revokeSession(session.id)}
                    disabled={isRevoking === session.id}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isRevoking === session.id ? 'Revoking...' : 'Revoke'}
                  </motion.button>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {sessions.filter(s => !s.current).length > 0 && (
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={revokeAllOtherSessions}
          disabled={isRevoking === 'all'}
          className="mt-6 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isRevoking === 'all' ? 'Revoking All...' : 'Revoke All Other Sessions'}
        </motion.button>
      )}
    </motion.div>
  );
}

// Helper functions for SessionsSettings
function formatLastActive(dateString: string): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

function parseBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown Browser';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Microsoft Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown Browser';
}

function PrivacySettings() {
  const { settings, updatePrivacySettings, isSaving } = useSettingsStore();

  const handleSelectChange = async (key: keyof typeof settings.privacy, value: string) => {
    try {
      await updatePrivacySettings({ [key]: value });
      toast.success('Privacy settings updated');
    } catch {
      toast.error('Failed to update privacy settings');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-6">
        Privacy
      </h1>

      <div className="space-y-4">
        <GlassCard variant="default" className="p-4">
          <h3 className="font-medium text-white mb-2">Who can send you direct messages</h3>
          <select 
            value={settings.privacy.allowMessageRequests ? 'everyone' : 'nobody'}
            onChange={(e) => handleSelectChange('allowMessageRequests', e.target.value === 'everyone' ? 'true' : 'false')}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white disabled:opacity-50"
          >
            <option value="everyone">Everyone</option>
            <option value="friends">Friends Only</option>
            <option value="nobody">No One</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <h3 className="font-medium text-white mb-2">Who can see your online status</h3>
          <select 
            value={settings.privacy.showOnlineStatus ? 'everyone' : 'nobody'}
            onChange={async (e) => {
              try {
                await updatePrivacySettings({ showOnlineStatus: e.target.value === 'everyone' });
                toast.success('Online status visibility updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white disabled:opacity-50"
          >
            <option value="everyone">Everyone</option>
            <option value="nobody">No One</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <h3 className="font-medium text-white mb-2">Who can add you to groups</h3>
          <select 
            value={settings.privacy.allowGroupInvites}
            onChange={async (e) => {
              try {
                await updatePrivacySettings({ allowGroupInvites: e.target.value as 'anyone' | 'friends' | 'nobody' });
                toast.success('Group invite settings updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white disabled:opacity-50"
          >
            <option value="anyone">Everyone</option>
            <option value="friends">Friends Only</option>
            <option value="nobody">No One</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <h3 className="font-medium text-white mb-2">Profile Visibility</h3>
          <select 
            value={settings.privacy.profileVisibility}
            onChange={async (e) => {
              try {
                await updatePrivacySettings({ profileVisibility: e.target.value as 'public' | 'friends' | 'private' });
                toast.success('Profile visibility updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white disabled:opacity-50"
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Allow Friend Requests</h3>
              <p className="text-sm text-gray-400">Let others send you friend requests</p>
            </div>
            <button
              onClick={async () => {
                try {
                  await updatePrivacySettings({ allowFriendRequests: !settings.privacy.allowFriendRequests });
                  toast.success('Friend request settings updated');
                } catch {
                  toast.error('Failed to update settings');
                }
              }}
              disabled={isSaving}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.privacy.allowFriendRequests ? 'bg-primary-600' : 'bg-dark-600'
              } ${isSaving ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.privacy.allowFriendRequests ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Show in Search Results</h3>
              <p className="text-sm text-gray-400">Allow others to find you in search</p>
            </div>
            <button
              onClick={async () => {
                try {
                  await updatePrivacySettings({ showInSearch: !settings.privacy.showInSearch });
                  toast.success('Search visibility updated');
                } catch {
                  toast.error('Failed to update settings');
                }
              }}
              disabled={isSaving}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.privacy.showInSearch ? 'bg-primary-600' : 'bg-dark-600'
              } ${isSaving ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.privacy.showInSearch ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Read Receipts</h3>
              <p className="text-sm text-gray-400">Show when you've read messages</p>
            </div>
            <button
              onClick={async () => {
                try {
                  await updatePrivacySettings({ showReadReceipts: !settings.privacy.showReadReceipts });
                  toast.success('Read receipts updated');
                } catch {
                  toast.error('Failed to update settings');
                }
              }}
              disabled={isSaving}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.privacy.showReadReceipts ? 'bg-primary-600' : 'bg-dark-600'
              } ${isSaving ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.privacy.showReadReceipts ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}

function BillingSettings() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Redirect to Stripe checkout or show upgrade modal
      const response = await api.post('/api/v1/billing/checkout');
      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        toast.info('Premium upgrade coming soon!');
      }
    } catch {
      toast.info('Premium upgrade coming soon!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-6">
        Billing
      </h1>

      <GlassCard variant={user?.isPremium ? 'holographic' : 'default'} glow={user?.isPremium} className="p-6 mb-6">
        <h3 className="font-medium text-white mb-2">Current Plan</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">
              {user?.isPremium ? (
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  ✨ Premium
                </span>
              ) : (
                'Free'
              )}
            </p>
            <p className="text-gray-400">
              {user?.isPremium ? 'All features unlocked' : 'Basic features included'}
            </p>
          </div>
          {!user?.isPremium && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpgrade}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Upgrade to Premium'}
            </motion.button>
          )}
        </div>
      </GlassCard>

      <GlassCard variant="crystal" glow className="p-6">
        <h3 className="font-medium text-white mb-4">Premium Benefits</h3>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <div>
              <span className="font-medium">Custom Profile Themes</span>
              <p className="text-sm text-gray-500">Personalize your profile with exclusive themes</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <div>
              <span className="font-medium">Animated Avatars</span>
              <p className="text-sm text-gray-500">Upload GIF avatars and profile banners</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <div>
              <span className="font-medium">Extended File Upload (100MB)</span>
              <p className="text-sm text-gray-500">Upload larger files and media</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <div>
              <span className="font-medium">Custom Titles & Badges</span>
              <p className="text-sm text-gray-500">Unlock exclusive titles and badges</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <div>
              <span className="font-medium">Priority Support</span>
              <p className="text-sm text-gray-500">Get faster response times from our team</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-400 text-lg">✓</span>
            <div>
              <span className="font-medium">2x XP & Coin Earnings</span>
              <p className="text-sm text-gray-500">Level up faster and earn more rewards</p>
            </div>
          </li>
        </ul>
      </GlassCard>
    </motion.div>
  );
}
