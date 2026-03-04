/**
 * ConversationNotificationSettings Component
 *
 * Dialog for managing per-conversation notification preferences.
 * Allows users to set notification mode (all, mentions only, mute)
 * with optional mute duration.
 *
 * @module modules/chat/components
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BellIcon,
  BellSlashIcon,
  BellAlertIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import type {
  NotificationMode,
  NotificationPreference,
} from '@cgraph/shared-types';

interface ConversationNotificationSettingsProps {
  conversationId: string;
  targetType?: 'conversation' | 'channel' | 'group';
  isOpen: boolean;
  onClose: () => void;
}

const MODE_OPTIONS: { value: NotificationMode; label: string; description: string; icon: typeof BellIcon }[] = [
  {
    value: 'all',
    label: 'All messages',
    description: 'Get notified for every message',
    icon: BellIcon,
  },
  {
    value: 'mentions_only',
    label: 'Mentions only',
    description: 'Only get notified when mentioned',
    icon: BellAlertIcon,
  },
  {
    value: 'none',
    label: 'Mute',
    description: 'No notifications from this conversation',
    icon: BellSlashIcon,
  },
];

const MUTE_DURATIONS = [
  { label: '1 hour', seconds: 3600 },
  { label: '8 hours', seconds: 28800 },
  { label: '24 hours', seconds: 86400 },
  { label: '1 week', seconds: 604800 },
  { label: 'Forever', seconds: null },
] as const;

export function ConversationNotificationSettings({
  conversationId,
  targetType = 'conversation',
  isOpen,
  onClose,
}: ConversationNotificationSettingsProps) {
  const [currentMode, setCurrentMode] = useState<NotificationMode>('all');
  const [mutedUntil, setMutedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDurations, setShowDurations] = useState(false);

  // Fetch current preference on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchPreference = async () => {
      try {
        const res = await api.get<{ data: { preference: NotificationPreference } }>(
          `/api/v1/notification-preferences/${targetType}/${conversationId}`
        );
        const pref = res.data?.data?.preference ?? (res.data as unknown as { preference: NotificationPreference })?.preference;
        if (pref) {
          setCurrentMode((pref.mode as NotificationMode) || 'all');
          setMutedUntil(pref.mutedUntil ?? null);
        }
      } catch {
        // Default to "all" if no preference found
        setCurrentMode('all');
      }
    };

    fetchPreference();
  }, [isOpen, conversationId, targetType]);

  const updatePreference = useCallback(
    async (mode: NotificationMode, muteUntil?: string | null) => {
      setLoading(true);
      try {
        if (mode === 'all') {
          // Reset to default — delete the preference
          await api.delete(`/api/v1/notification-preferences/${targetType}/${conversationId}`);
        } else {
          await api.put(
            `/api/v1/notification-preferences/${targetType}/${conversationId}`,
            { mode, muted_until: muteUntil ?? null }
          );
        }
        setCurrentMode(mode);
        setMutedUntil(muteUntil ?? null);
        setShowDurations(false);
      } catch (err) {
        console.error('Failed to update notification preference:', err);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, targetType]
  );

  const handleModeSelect = useCallback(
    (mode: NotificationMode) => {
      if (mode === 'none') {
        setShowDurations(true);
      } else {
        updatePreference(mode);
      }
    },
    [updatePreference]
  );

  const handleMuteDuration = useCallback(
    (seconds: number | null) => {
      const muteUntil = seconds
        ? new Date(Date.now() + seconds * 1000).toISOString()
        : null;
      updatePreference('none', muteUntil);
    },
    [updatePreference]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Current status */}
          {mutedUntil && currentMode === 'none' && (
            <div className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              Muted until {new Date(mutedUntil).toLocaleString()}
            </div>
          )}

          {/* Mode selection — or duration picker */}
          {showDurations ? (
            <div className="space-y-1">
              <p className="mb-3 text-sm text-gray-400">Mute for how long?</p>
              {MUTE_DURATIONS.map((d) => (
                <button
                  key={d.label}
                  onClick={() => handleMuteDuration(d.seconds)}
                  disabled={loading}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {d.label}
                </button>
              ))}
              <button
                onClick={() => setShowDurations(false)}
                className="mt-2 w-full rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-300"
              >
                Back
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {MODE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = currentMode === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleModeSelect(option.value)}
                    disabled={loading}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors disabled:opacity-50 ${
                      isSelected
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-200 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                    {isSelected && <CheckIcon className="h-4 w-4 flex-shrink-0 text-primary-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ConversationNotificationSettings;
