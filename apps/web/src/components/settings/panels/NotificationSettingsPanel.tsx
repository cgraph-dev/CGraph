import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from '@/components/Toast';
import { GlassCard } from '@/shared/components/ui';

export function NotificationSettingsPanel() {
  const { settings, updateNotificationSettings, isSaving, fetchSettings } = useSettingsStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [pushState, setPushState] = useState<{
    supported: boolean;
    permission: string;
    registered: boolean;
  }>({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = useCallback(
    async (key: keyof typeof settings.notifications, value: boolean) => {
      try {
        await updateNotificationSettings({ [key]: value });
        toast.success('Settings saved');
      } catch {
        toast.error('Failed to save settings');
      }
    },
    [updateNotificationSettings]
  );

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
        setPushState((prev) => ({ ...prev, registered: true, permission: 'granted' }));
        toast.success('Push notifications enabled');
      } else {
        toast.error(result.error || 'Failed to enable push notifications');
      }
    } else {
      // Disable push notifications
      await webPush.unregisterFromPushNotifications();
      await updateNotificationSettings({ pushNotifications: false });
      setPushState((prev) => ({ ...prev, registered: false }));
      toast.success('Push notifications disabled');
    }
  }, [settings.notifications.pushNotifications, pushState.supported, updateNotificationSettings]);

  const Toggle = ({
    settingKey,
    value,
  }: {
    settingKey: keyof typeof settings.notifications;
    value: boolean;
  }) => (
    <button
      onClick={() => handleToggle(settingKey, !value)}
      disabled={isSaving}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        value ? 'bg-primary-600' : 'bg-dark-600'
      } ${isSaving ? 'cursor-wait opacity-50' : ''}`}
    >
      <span
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          value ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
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
      <h1 className="mb-6 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
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
            <Toggle
              settingKey="notifyForumReplies"
              value={settings.notifications.notifyForumReplies}
            />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Friend Requests</h3>
              <p className="text-sm text-gray-400">Notify when you receive a friend request</p>
            </div>
            <Toggle
              settingKey="notifyFriendRequests"
              value={settings.notifications.notifyFriendRequests}
            />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Group Invites</h3>
              <p className="text-sm text-gray-400">Notify when you're invited to a group</p>
            </div>
            <Toggle
              settingKey="notifyGroupInvites"
              value={settings.notifications.notifyGroupInvites}
            />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Email Notifications</h3>
              <p className="text-sm text-gray-400">Receive notifications via email</p>
            </div>
            <Toggle
              settingKey="emailNotifications"
              value={settings.notifications.emailNotifications}
            />
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
                  : 'Not supported in this browser'}
              </p>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={isSaving || !pushState.supported || pushState.permission === 'denied'}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.notifications.pushNotifications && pushState.registered
                  ? 'bg-primary-600'
                  : 'bg-dark-600'
              } ${isSaving || !pushState.supported || pushState.permission === 'denied' ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span
                className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.notifications.pushNotifications && pushState.registered
                    ? 'translate-x-5'
                    : ''
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
            <Toggle
              settingKey="notificationSound"
              value={settings.notifications.notificationSound}
            />
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
