import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AccountSettings');
import { api } from '@/lib/api';
import { toast } from '@/shared/components/ui';
import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { getAvatarBorderId } from '@/lib/utils';

/**
 * AccountSettings - User account management component
 *
 * Handles:
 * - Profile picture upload
 * - Username changes (14-day cooldown)
 * - Display name updates
 * - Email management
 * - Wallet connection
 */
export function AccountSettings() {
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
      updateUser({
        displayName: response.data.data.display_name || response.data.data.displayName,
      });
      toast.success('Settings saved');
    } catch (error) {
      logger.error('Failed to save settings:', error);
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
      const errorMessage =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Failed to change username';
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
      <h1 className="mb-6 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
        Account Settings
      </h1>

      {/* User ID Badge */}
      <GlassCard
        variant="holographic"
        glow
        glowColor="rgba(16, 185, 129, 0.3)"
        className="mb-8 p-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 ring-4 ring-primary-500/20">
            {user?.avatarUrl ? (
              <ThemedAvatar
                src={user.avatarUrl}
                alt={user?.displayName || user?.username || 'User'}
                size="large"
                className="h-16 w-16"
                avatarBorderId={getAvatarBorderId(user)}
              />
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
              {user?.isVerified && <span className="text-blue-400">✓</span>}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="rounded border border-primary-800/50 bg-dark-700 px-2 py-1 font-mono text-sm text-primary-400">
                {user?.userIdDisplay || '#0000'}
              </span>
              {user?.username && <span className="text-gray-400">@{user.username}</span>}
              {user?.karma !== undefined && user.karma > 0 && (
                <span className="text-sm text-amber-400">
                  ⚡ {(user.karma ?? 0).toLocaleString()} karma
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Avatar */}
      <GlassCard variant="crystal" glow className="mb-8 p-6">
        <label className="mb-3 block text-sm font-medium text-gray-300">Profile Picture</label>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-dark-700 ring-2 ring-dark-600 transition-all hover:ring-primary-500">
            {user?.avatarUrl ? (
              <ThemedAvatar
                src={user.avatarUrl}
                alt={user?.displayName || user?.username || 'User'}
                size="large"
                className="h-20 w-20"
                avatarBorderId={getAvatarBorderId(user)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
                {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => HapticFeedback.medium()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20"
            >
              Upload Image
            </motion.button>
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, or GIF. Max 2MB.</p>
          </div>
        </div>
      </GlassCard>

      {/* Username with 14-day cooldown */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Username
          {!canChangeUsername && nextChangeDate && (
            <span className="ml-2 text-xs text-amber-400">(Can change after {nextChangeDate})</span>
          )}
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            disabled={!canChangeUsername}
            placeholder={user?.username || 'Choose a username'}
            className={`flex-1 rounded-lg border bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              canChangeUsername
                ? 'border-dark-600'
                : 'cursor-not-allowed border-dark-600/50 text-gray-500'
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
              className="rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50"
            >
              {isChangingUsername ? 'Saving...' : 'Change'}
            </motion.button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {canChangeUsername
            ? 'Username can be changed every 14 days. Letters, numbers, and underscores only.'
            : `You changed your username recently. Next change available on ${nextChangeDate}.`}
        </p>
      </GlassCard>

      {/* Display Name */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How should we call you?"
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </GlassCard>

      {/* Email */}
      <GlassCard variant="default" className="mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </GlassCard>

      {/* Wallet */}
      <GlassCard variant="crystal" glow className="mb-8 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Connected Wallet</label>
        {user?.walletAddress ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={user.walletAddress}
              disabled
              className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 font-mono text-sm text-gray-400"
            />
            <button className="rounded-lg bg-red-600/20 px-4 py-3 text-sm font-medium text-red-400 transition-all hover:scale-105 hover:bg-red-600/30 active:scale-95">
              Disconnect
            </button>
          </div>
        ) : (
          <button className="rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-sm font-medium text-white transition-all hover:border-primary-500 hover:bg-dark-600">
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
        className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:from-primary-700 hover:to-primary-800 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </motion.div>
  );
}

export default AccountSettings;
