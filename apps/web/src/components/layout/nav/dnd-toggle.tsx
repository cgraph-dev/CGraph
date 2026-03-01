/**
 * DND Quick Toggle — Nav bar button with duration dropdown.
 * @module components/layout/nav/dnd-toggle
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoonIcon } from '@heroicons/react/24/outline';
import { MoonIcon as MoonIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { api } from '@/lib/api';

interface DndState {
  active: boolean;
  dndUntil: string | null;
}

const DND_OPTIONS = [
  { label: 'For 1 hour', minutes: 60 },
  { label: 'For 2 hours', minutes: 120 },
  { label: 'For 8 hours', minutes: 480 },
  { label: 'Until tomorrow morning', minutes: 0 }, // Special calc
  { label: 'Until I turn it off', minutes: -1 }, // Indefinite
] as const;

function getMinutesUntilTomorrowMorning(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return Math.ceil((tomorrow.getTime() - now.getTime()) / 60000);
}

function formatDndExpiry(dndUntil: string): string {
  const date = new Date(dndUntil);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) return '';

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `DND for ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `DND for ${diffHours}h`;
  return 'DND active';
}

/** DND quick toggle with duration picker dropdown */
export function DndToggle() {
  const [dndState, setDndState] = useState<DndState>({ active: false, dndUntil: null });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch DND state
  const fetchDndState = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/settings/dnd');
      const data = response.data?.data?.dnd || response.data?.dnd;
      if (data) {
        setDndState({
          active: data.active,
          dndUntil: data.dnd_until,
        });
      }
    } catch {
      // Silently fail — DND state is non-critical
    }
  }, []);

  useEffect(() => {
    fetchDndState();
    // Poll every minute to detect expiry
    const interval = setInterval(fetchDndState, 60000);
    return () => clearInterval(interval);
  }, [fetchDndState]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activateDnd = useCallback(
    async (option: (typeof DND_OPTIONS)[number]) => {
      setLoading(true);
      try {
        let body: Record<string, unknown>;
        if (option.minutes === -1) {
          body = { indefinite: true };
        } else if (option.minutes === 0) {
          body = { duration_minutes: getMinutesUntilTomorrowMorning() };
        } else {
          body = { duration_minutes: option.minutes };
        }
        const response = await api.post('/api/v1/settings/dnd', body);
        const data = response.data?.data?.dnd || response.data?.dnd;
        if (data) {
          setDndState({ active: true, dndUntil: data.dnd_until });
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
        setOpen(false);
      }
    },
    []
  );

  const clearDnd = useCallback(async () => {
    setLoading(true);
    try {
      await api.delete('/api/v1/settings/dnd');
      setDndState({ active: false, dndUntil: null });
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }, []);

  const tooltipText =
    dndState.active && dndState.dndUntil ? formatDndExpiry(dndState.dndUntil) : 'Do Not Disturb';

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          HapticFeedback.light();
          if (dndState.active) {
            clearDnd();
          } else {
            setOpen((v) => !v);
          }
        }}
        title={tooltipText}
        className="relative rounded-lg p-2 hover:bg-white/10"
      >
        {dndState.active ? (
          <MoonIconSolid className="h-5 w-5 text-amber-400" />
        ) : (
          <MoonIcon className="h-5 w-5 text-white/60" />
        )}
        {dndState.active && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {open && !dndState.active && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-56"
          >
            <GlassCard variant="default" className="overflow-hidden p-1">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Do Not Disturb
              </p>
              {DND_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => activateDnd(option)}
                  disabled={loading}
                  className="flex w-full items-center rounded-md px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  <MoonIcon className="mr-2 h-4 w-4 text-amber-400" />
                  {option.label}
                </button>
              ))}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
