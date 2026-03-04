/**
 * Push Notification Permission Prompt
 *
 * Discord/Meta-style non-intrusive slide-in banner that prompts users
 * to enable browser push notifications. Shows once per session after
 * a delay, only when permission is 'default' (never asked before).
 *
 * Follows Google's best practices:
 * - Never prompt immediately on page load
 * - Explain the value before requesting permission
 * - Provide a dismiss option
 * - Don't re-prompt if dismissed
 *
 * @module PushNotificationPrompt
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';

const DISMISS_KEY = 'cgraph:push-prompt-dismissed';
const PROMPT_DELAY_MS = 15_000; // Show after 15s (Discord-style delayed prompt)

/**
 * unknown for the push-notification-prompt.tsx module.
 */
/**
 * Push Notification Prompt component.
 */
export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useAuthStore((s) => !!s.user);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Don't show if already dismissed, denied, or granted
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'default') return;

    const timer = setTimeout(() => setVisible(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleEnable = useCallback(async () => {
    setLoading(true);
    try {
      const webPush = await import('@/services/webPushService');
      const result = await webPush.registerForPushNotifications();
      if (result.success) {
        setVisible(false);
      } else {
        // Permission denied — don't re-prompt
        localStorage.setItem(DISMISS_KEY, 'denied');
        setVisible(false);
      }
    } catch {
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[rgb(30,32,40)]/[0.85] px-5 py-4 shadow-2xl backdrop-blur-[20px] backdrop-saturate-[1.4]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/20">
              <BellAlertIcon className="h-5 w-5 text-primary-400" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Stay in the loop</p>
              <p className="text-xs text-gray-400">
                Get notified about messages, mentions & forum replies
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
              >
                {loading ? 'Enabling…' : 'Enable'}
              </button>

              <button
                onClick={handleDismiss}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Dismiss"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
