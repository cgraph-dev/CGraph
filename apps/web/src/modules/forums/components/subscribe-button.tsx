/**
 * Forum Subscribe Button
 *
 * Discord-style subscribe/bell button for forums, boards, and threads.
 * Supports three notification levels: All, Mentions, None.
 *
 * Uses REST API at /api/forum/subscriptions
 *
 * @module modules/forums/components
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BellIcon,
  BellSlashIcon,
  BellAlertIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { api } from '@/lib/api';
import { toast } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';

type NotificationLevel = 'all' | 'mentions' | 'none';
type TargetType = 'forum' | 'board' | 'thread';

interface SubscribeButtonProps {
  targetType: TargetType;
  targetId: string;
  /** Current subscription (null if not subscribed) */
  subscription?: {
    id: string;
    notification_level: NotificationLevel;
  } | null;
  /** Compact mode for inline use */
  compact?: boolean;
  onSubscriptionChange?: (
    sub: { id: string; notification_level: NotificationLevel } | null
  ) => void;
}

const LEVELS: { value: NotificationLevel; label: string; desc: string; icon: typeof BellIcon }[] = [
  { value: 'all', label: 'All Activity', desc: 'Get notified for everything', icon: BellAlertIcon },
  {
    value: 'mentions',
    label: 'Mentions Only',
    desc: 'Only when you are mentioned',
    icon: BellIcon,
  },
  { value: 'none', label: 'Muted', desc: 'No notifications', icon: BellSlashIcon },
];

/**
 * unknown for the forums module.
 */
/**
 * Subscribe Button component.
 */
export function SubscribeButton({
  targetType,
  targetId,
  subscription: initialSub = null,
  compact = false,
  onSubscriptionChange,
}: SubscribeButtonProps) {
  const [sub, setSub] = useState(initialSub);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
       
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { // safe downcast – DOM element
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSubscribe = useCallback(
    async (level: NotificationLevel) => {
      setLoading(true);
      try {
        if (sub) {
          if (level === sub.notification_level) {
            // Unsubscribe
            await api.delete(`/api/v1/forum/subscriptions/${sub.id}`);
            setSub(null);
            onSubscriptionChange?.(null);
            toast.success('Unsubscribed');
          } else {
            // Update level
            const res = await api.put(`/api/v1/forum/subscriptions/${sub.id}`, {
              notification_level: level,
            });
            const updated = {
              id: res.data?.subscription?.id ?? sub.id,
              notification_level: level,
            };
            setSub(updated);
            onSubscriptionChange?.(updated);
            toast.success(`Notifications: ${level}`);
          }
        } else {
          // Create subscription
          const payload: Record<string, string> = {
            notification_level: level,
            [`${targetType}_id`]: targetId,
          };
          const res = await api.post('/api/v1/forum/subscriptions', payload);
          const created = {
            id: res.data?.subscription?.id,
            notification_level: level,
          };
          setSub(created);
          onSubscriptionChange?.(created);
          toast.success('Subscribed');
        }
      } catch {
        toast.error('Failed to update subscription');
      } finally {
        setLoading(false);
        setMenuOpen(false);
      }
    },
    [sub, targetType, targetId, onSubscriptionChange]
  );

  const Icon = sub ? BellSolidIcon : BellIcon;
  const isSubscribed = !!sub;

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center">
        {/* Main button */}
        <button
          onClick={() => (isSubscribed ? setMenuOpen(!menuOpen) : handleSubscribe('all'))}
          disabled={loading}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isSubscribed
              ? 'bg-primary-600/20 text-primary-400 hover:bg-primary-600/30'
              : 'bg-dark-600 text-gray-300 hover:bg-dark-500 hover:text-white'
          } disabled:opacity-50`}
        >
          <Icon className="h-4 w-4" />
          {!compact && <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>}
          {isSubscribed && <ChevronDownIcon className="h-3 w-3" />}
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={tweens.quickFade}
            className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-dark-800 shadow-2xl"
          >
            {LEVELS.map((level) => {
              const LevelIcon = level.icon;
              const isActive = sub?.notification_level === level.value;
              return (
                <button
                  key={level.value}
                  onClick={() => handleSubscribe(level.value)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                    isActive ? 'bg-primary-600/10' : ''
                  }`}
                >
                  <LevelIcon
                    className={`h-4 w-4 ${isActive ? 'text-primary-400' : 'text-gray-400'}`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${isActive ? 'text-primary-400' : 'text-white'}`}
                    >
                      {level.label}
                    </p>
                    <p className="text-xs text-gray-500">{level.desc}</p>
                  </div>
                  {isActive && <span className="ml-auto text-xs text-primary-400">✓</span>}
                </button>
              );
            })}

            {isSubscribed && (
              <>
                <div className="border-t border-white/5" />
                <button
                  onClick={() => handleSubscribe(sub!.notification_level)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <BellSlashIcon className="h-4 w-4" />
                  <span className="text-sm">Unsubscribe</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
