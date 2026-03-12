/**
 * ScheduledPostForm Component
 *
 * Form for scheduling a forum post to be published at a future time.
 *
 * Features:
 * - Date input + time input
 * - Content preview area
 * - Timezone display
 * - Confirm button with validation
 *
 * @module modules/forums/components/scheduled-post-form
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDaysIcon,
  ClockIcon,
  GlobeAltIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface ScheduledPostFormProps {
  /** The content to preview (plain text or rendered preview) */
  content?: string;
  /** Title of the scheduled post */
  title?: string;
  /** Called when user confirms scheduling */
  onSchedule?: (scheduledAt: string) => void;
  /** Called to cancel */
  onCancel?: () => void;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function getMinDate(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getMinTime(date: string): string {
  const today = getMinDate();
  if (date === today) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes() + 5).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return '00:00';
}

// ── Component ──────────────────────────────────────────────────────────

export default function ScheduledPostForm({
  content,
  title,
  onSchedule,
  onCancel,
  className,
}: ScheduledPostFormProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const timezone = useMemo(() => getUserTimezone(), []);

  const isValid = useMemo(() => {
    if (!date || !time) return false;
    const scheduled = new Date(`${date}T${time}`);
    return scheduled > new Date();
  }, [date, time]);

  const scheduledDisplay = useMemo(() => {
    if (!date || !time) return null;
    try {
      const dt = new Date(`${date}T${time}`);
      return dt.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  }, [date, time]);

  const handleSubmit = () => {
    if (!isValid || !onSchedule) return;
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    onSchedule(scheduledAt);
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.03] p-4',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <CalendarDaysIcon className="h-5 w-5 text-primary-400" />
        <h3 className="text-sm font-bold text-white">Schedule Post</h3>
      </div>

      {/* Date & Time */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Date</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              min={getMinDate()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 [color-scheme:dark]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Time</label>
          <div className="relative">
            <input
              type="time"
              value={time}
              min={date ? getMinTime(date) : undefined}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
        <GlobeAltIcon className="h-4 w-4" />
        <span>Timezone: {timezone}</span>
      </div>

      {/* Scheduled time summary */}
      {scheduledDisplay && (
        <div className="mb-4 rounded-lg border border-primary-500/20 bg-primary-500/10 px-3 py-2 text-sm text-primary-300">
          <ClockIcon className="mr-1.5 inline h-4 w-4" />
          Will be published: {scheduledDisplay}
        </div>
      )}

      {/* Content Preview */}
      {content && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="mb-2 flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-gray-300"
          >
            <EyeIcon className="h-3.5 w-3.5" />
            {showPreview ? 'Hide' : 'Show'} preview
          </button>

          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
            >
              {title && (
                <h4 className="mb-2 text-sm font-semibold text-white">{title}</h4>
              )}
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-gray-300">
                {content}
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          whileHover={isValid ? { scale: 1.01 } : undefined}
          whileTap={isValid ? { scale: 0.99 } : undefined}
          className={cn(
            'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all',
            isValid
              ? 'bg-primary-600 text-white hover:bg-primary-500'
              : 'cursor-not-allowed bg-white/[0.04] text-gray-600',
          )}
        >
          Schedule
        </motion.button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
