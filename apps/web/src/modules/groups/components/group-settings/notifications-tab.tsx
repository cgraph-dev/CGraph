/**
 * NotificationsTab component - Per-group notification preferences
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BellIcon,
  BellSlashIcon,
  ChatBubbleLeftIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { entranceVariants } from '@/lib/animation-presets';
import { useGroupStore } from '@/modules/groups/store';
import { api } from '@/lib/api';

type NotificationLevel = 'all' | 'mentions' | 'none';

interface NotificationsTabProps {
  groupId: string;
}

/**
 * unknown for the groups module.
 */
/**
 * Notifications Tab component.
 */
export function NotificationsTab({ groupId }: NotificationsTabProps) {
  const { groups } = useGroupStore();
  const activeGroup = groups.find((g) => g.id === groupId);
  const myMember = activeGroup?.myMember;

  const [suppressEveryone, setSuppressEveryone] = useState(myMember?.suppressEveryone ?? false);
  const [suppressRoles, setSuppressRoles] = useState(false);
  const [notifLevel, setNotifLevel] = useState<NotificationLevel>(
    myMember?.notifications ?? 'mentions'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state when member data loads
  useEffect(() => {
    if (myMember) {
      setNotifLevel(myMember.notifications ?? 'mentions');
      setSuppressEveryone(myMember.suppressEveryone ?? false);
    }
  }, [myMember]);

  const notifOptions = [
    {
       
      level: 'all' as NotificationLevel, // safe downcast – literal to union
      label: 'All Messages',
      desc: 'Receive notifications for every message',
      icon: ChatBubbleLeftIcon,
    },
    {
       
      level: 'mentions' as NotificationLevel, // safe downcast – literal to union
      label: 'Only @Mentions',
      desc: 'Only receive notifications when mentioned',
      icon: AtSymbolIcon,
    },
    {
       
      level: 'none' as NotificationLevel, // safe downcast – literal to union
      label: 'Nothing',
      desc: 'Suppress all notifications from this group',
      icon: BellSlashIcon,
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/api/v1/groups/${groupId}/members/me/notifications`, {
        notifications: notifLevel,
        suppress_everyone: suppressEveryone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_err) {
      setError('Failed to save notification preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Notifications</h2>
        <p className="text-gray-400">Configure notification preferences for this group.</p>
      </div>

      {/* Notification Level */}
      <GlassCard variant="frosted" className="space-y-4 p-6">
        <h3 className="font-semibold text-white">Notification Level</h3>
        <div className="space-y-2">
          {notifOptions.map((opt, index) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.level}
                variants={entranceVariants.fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                onClick={() => setNotifLevel(opt.level)}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                  notifLevel === opt.level
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-700/50 hover:border-gray-600'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    notifLevel === opt.level ? 'bg-primary-500/20' : 'bg-dark-700'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${notifLevel === opt.level ? 'text-primary-400' : 'text-gray-400'}`}
                  />
                </div>
                <div>
                  <div
                    className={`font-medium ${notifLevel === opt.level ? 'text-primary-400' : 'text-white'}`}
                  >
                    {opt.label}
                  </div>
                  <div className="text-sm text-gray-500">{opt.desc}</div>
                </div>
                <div className="ml-auto">
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      notifLevel === opt.level
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-600'
                    }`}
                  >
                    {notifLevel === opt.level && (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      {/* Suppression Settings */}
      <GlassCard variant="frosted" className="space-y-4 p-6">
        <h3 className="font-semibold text-white">Suppression</h3>

        <label className="flex cursor-pointer items-center justify-between">
          <div className="flex items-center gap-3">
            <AtSymbolIcon className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-white">Suppress @everyone</div>
              <div className="text-xs text-gray-500">Ignore mass mentions</div>
            </div>
          </div>
          <button
            onClick={() => setSuppressEveryone(!suppressEveryone)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              suppressEveryone ? 'bg-primary-600' : 'bg-dark-700'
            }`}
          >
            <motion.div
              animate={{ x: suppressEveryone ? 20 : 2 }}
              className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
            />
          </button>
        </label>

        <label className="flex cursor-pointer items-center justify-between">
          <div className="flex items-center gap-3">
            <BellIcon className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-white">Suppress Role Mentions</div>
              <div className="text-xs text-gray-500">Ignore role-based mentions</div>
            </div>
          </div>
          <button
            onClick={() => setSuppressRoles(!suppressRoles)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              suppressRoles ? 'bg-primary-600' : 'bg-dark-700'
            }`}
          >
            <motion.div
              animate={{ x: suppressRoles ? 20 : 2 }}
              className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
            />
          </button>
        </label>
      </GlassCard>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Preferences'}
        </motion.button>
      </div>
    </motion.div>
  );
}
