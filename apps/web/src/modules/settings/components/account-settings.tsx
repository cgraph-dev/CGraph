import { useState, useActionState } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AccountSettings');
import { api } from '@/lib/api';
import { toast } from '@/shared/components/ui';
import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { SaveProfileState } from './account-settings.types';
import { UserIdBadge } from './user-id-badge';
import { AvatarSection } from './avatar-section';
import { ProfileFormFields } from './profile-form-fields';

/**
 * AccountSettings - User account management component
 *
 * Handles:
 * - Profile picture upload
 * - Username changes (14-day cooldown)
 * - Display name updates
 * - Email management
 * - Wallet connection
 *
 * Uses React 19 useActionState for profile save and username change actions.
 */
export function AccountSettings() {
  const { user, updateUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  const canChangeUsername = user?.canChangeUsername ?? true;
  const nextChangeDate = user?.usernameNextChangeAt
    ? new Date(user.usernameNextChangeAt).toLocaleDateString()
    : null;

  const [saveState, saveAction, isSaving] = useActionState(
    async (_prev: SaveProfileState, formData: FormData): Promise<SaveProfileState> => {
      const displayName = formData.get('displayName') as string;
      const bio = formData.get('bio') as string;
      const pronouns = formData.get('pronouns') as string;

      try {
        const response = await api.put('/api/v1/me', {
          display_name: displayName,
          bio,
          pronouns,
        });
        updateUser({
          displayName: response.data.data.display_name || response.data.data.displayName,
        });
        toast.success('Settings saved');
        HapticFeedback.success();
        return { error: null };
      } catch (error) {
        logger.error('Failed to save settings:', error);
        toast.error('Failed to save settings');
        return { error: 'Failed to save settings' };
      }
    },
    { error: null }
  );

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

      <UserIdBadge user={user} />
      <AvatarSection user={user} />

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

      {/* Profile Form — uses React 19 useActionState */}
      <form action={saveAction}>
        <ProfileFormFields
          user={user}
          email={email}
          setEmail={setEmail}
          isSaving={isSaving}
          saveError={saveState.error}
        />
      </form>
    </motion.div>
  );
}

export default AccountSettings;
