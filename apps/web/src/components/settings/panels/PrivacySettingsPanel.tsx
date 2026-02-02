import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from '@/shared/components/ui';
import { GlassCard } from '@/shared/components/ui';

export function PrivacySettingsPanel() {
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
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white disabled:opacity-50"
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
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white disabled:opacity-50"
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
                  allowGroupInvites: e.target.value as 'anyone' | 'friends' | 'nobody',
                });
                toast.success('Group invite settings updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white disabled:opacity-50"
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
                  profileVisibility: e.target.value as 'public' | 'friends' | 'private',
                });
                toast.success('Profile visibility updated');
              } catch {
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white disabled:opacity-50"
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
                  await updatePrivacySettings({
                    allowFriendRequests: !settings.privacy.allowFriendRequests,
                  });
                  toast.success('Friend request settings updated');
                } catch {
                  toast.error('Failed to update settings');
                }
              }}
              disabled={isSaving}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.privacy.allowFriendRequests ? 'bg-primary-600' : 'bg-dark-600'
              } ${isSaving ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
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
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.privacy.showInSearch ? 'bg-primary-600' : 'bg-dark-600'
              } ${isSaving ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
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
                  await updatePrivacySettings({
                    showReadReceipts: !settings.privacy.showReadReceipts,
                  });
                  toast.success('Read receipts updated');
                } catch {
                  toast.error('Failed to update settings');
                }
              }}
              disabled={isSaving}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.privacy.showReadReceipts ? 'bg-primary-600' : 'bg-dark-600'
              } ${isSaving ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
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
