/**
 * Account settings form component.
 * @module
 */
import { useState, useActionState } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AccountSettings');
import { api } from '@/lib/api';
import { toast } from '@/shared/components/ui';

/** Safely extract a string from FormData */
function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { SaveProfileState } from './account-settings.types';
import { UserIdBadge } from './user-id-badge';
import { AvatarSection } from './avatar-section';
import { ProfileFormFields } from './profile-form-fields';
import { tweens } from '@/lib/animation-presets';

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
      const displayName = getFormString(formData, 'displayName');
      const bio = getFormString(formData, 'bio');
      const pronouns = getFormString(formData, 'pronouns');

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
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- safe: narrowing unknown error from catch
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
      transition={tweens.standard}
      className="space-y-6"
    >
      <div>
        <h1 className="mb-1 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
          Account Settings
        </h1>
        <p className="text-sm text-white/40">Manage your profile, username, and personal details</p>
      </div>

      <UserIdBadge user={user} />
      <AvatarSection user={user} />

      {/* Username with 14-day cooldown */}
      <GlassCard variant="default" className="relative mb-6 overflow-hidden p-6">
        {/* Section accent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70">
          Username
          {!canChangeUsername && nextChangeDate && (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/20">
              Locked until {nextChangeDate}
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
            className={`flex-1 rounded-xl border bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 shadow-inner shadow-black/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
              canChangeUsername
                ? 'border-white/[0.08] focus:border-primary-500/40'
                : 'cursor-not-allowed border-white/[0.04] text-gray-500'
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
              className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:shadow-primary-500/30 disabled:opacity-50"
            >
              {isChangingUsername ? 'Saving...' : 'Change'}
            </motion.button>
          )}
        </div>
        <p className="mt-2 text-xs text-white/30">
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
