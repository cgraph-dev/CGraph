/**
 * Privacy settings configuration panel.
 * @module
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { useSettingsStore } from '@/modules/settings/store';
import { toast } from '@/shared/components/ui';
import { GlassCard } from '@/shared/components/ui';
import { PROFILE_FIELD_VISIBILITY_OPTIONS } from './privacy-field-config';
import { PrivacyToggle } from './privacy-toggle';
import { tweens } from '@/lib/animation-presets';

/**
 * unknown for the settings module.
 */
/**
 * Privacy Settings Panel component.
 */
export function PrivacySettingsPanel() {
  const { settings, updatePrivacySettings, isSaving } = useSettingsStore();
  const [fieldVisExpanded, setFieldVisExpanded] = useState(false);

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
      transition={tweens.standard}
    >
      <h1 className="mb-6 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
        Privacy
      </h1>

      <div className="space-y-4">
        <GlassCard variant="default" className="p-4">
          <h3 className="mb-2 font-medium text-white">Who can send you direct messages</h3>
          <select
            value={settings.privacy.allowMessageRequests ? 'everyone' : 'nobody'}
            onChange={(e) =>
              handleSelectChange(
                'allowMessageRequests',
                e.target.value === 'everyone' ? 'true' : 'false'
              )
            }
            disabled={isSaving}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-white disabled:opacity-50"
          >
            <option value="everyone">Everyone</option>
            <option value="friends">Friends Only</option>
            <option value="nobody">No One</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <h3 className="mb-2 font-medium text-white">Who can see your online status</h3>
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
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-white disabled:opacity-50"
          >
            <option value="everyone">Everyone</option>
            <option value="nobody">No One</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <h3 className="mb-2 font-medium text-white">Who can add you to groups</h3>
          <select
            value={settings.privacy.allowGroupInvites}
            onChange={async (e) => {
              try {
                await updatePrivacySettings({
                   
                  allowGroupInvites: e.target.value as
                    | 'anyone'
                    | 'friends'
                    | 'nobody' /* safe downcast – select event value */,
                });
                toast.success('Group invite settings updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-white disabled:opacity-50"
          >
            <option value="anyone">Everyone</option>
            <option value="friends">Friends Only</option>
            <option value="nobody">No One</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <h3 className="mb-2 font-medium text-white">Profile Visibility</h3>
          <select
            value={settings.privacy.profileVisibility}
            onChange={async (e) => {
              try {
                await updatePrivacySettings({
                   
                  profileVisibility: e.target.value as
                    | 'public'
                    | 'friends'
                    | 'private' /* safe downcast – select event value */,
                });
                toast.success('Profile visibility updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2 text-white disabled:opacity-50"
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </GlassCard>

        {/* Per-field profile visibility (Discord/Meta-style granular controls) */}
        <GlassCard variant="default" className="p-4">
          <button
            onClick={() => setFieldVisExpanded((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <div>
              <h3 className="text-left font-medium text-white">Profile Field Visibility</h3>
              <p className="text-left text-sm text-gray-400">
                Control which profile fields are visible to others
              </p>
            </div>
            <span
              className={`text-gray-400 transition-transform ${fieldVisExpanded ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          </button>

          {fieldVisExpanded && (
            <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
              {PROFILE_FIELD_VISIBILITY_OPTIONS.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await updatePrivacySettings({
                          // safe downcast – dynamic key access on typed settings object
                           
                          [key]: !(settings.privacy as unknown as Record<string, unknown>)[key], // type assertion: dynamic privacy setting key access
                        });
                        toast.success(`${label} visibility updated`);
                      } catch {
                        toast.error('Failed to update settings');
                      }
                    }}
                    disabled={isSaving}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      // safe downcast – dynamic key access on typed settings object
                       
                      (settings.privacy as unknown as Record<string, unknown>)[key] !== false // type assertion: dynamic privacy setting key access
                        ? 'bg-primary-600'
                        : 'bg-white/[0.08]'
                    } ${isSaving ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        // safe downcast – dynamic key access on typed settings object
                         
                        (settings.privacy as unknown as Record<string, unknown>)[key] !== false // type assertion: dynamic privacy setting key access
                          ? 'translate-x-5'
                          : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <PrivacyToggle
            label="Allow Friend Requests"
            description="Let others send you friend requests"
            checked={settings.privacy.allowFriendRequests}
            disabled={isSaving}
            onToggle={async () => {
              try {
                await updatePrivacySettings({
                  allowFriendRequests: !settings.privacy.allowFriendRequests,
                });
                toast.success('Friend request settings updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
          />
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <PrivacyToggle
            label="Show in Search Results"
            description="Allow others to find you in search"
            checked={settings.privacy.showInSearch}
            disabled={isSaving}
            onToggle={async () => {
              try {
                await updatePrivacySettings({ showInSearch: !settings.privacy.showInSearch });
                toast.success('Search visibility updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
          />
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <PrivacyToggle
            label="Read Receipts"
            description="Show when you've read messages"
            checked={settings.privacy.showReadReceipts}
            disabled={isSaving}
            onToggle={async () => {
              try {
                await updatePrivacySettings({
                  showReadReceipts: !settings.privacy.showReadReceipts,
                });
                toast.success('Read receipts updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
          />
        </GlassCard>
      </div>
    </motion.div>
  );
}
