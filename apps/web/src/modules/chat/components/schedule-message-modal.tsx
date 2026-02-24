/**
 * Scheduled message timing modal.
 * @module
 */
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, XMarkIcon, CalendarIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { useScheduleMessageModal } from '@/modules/chat/hooks/useScheduleMessageModal';
import { ScheduledTimePreview } from '@/modules/chat/components/scheduled-time-preview';
import { springs } from '@/lib/animation-presets/presets';
import {
  QUICK_SCHEDULE_OPTIONS,
  resolveScheduleDate,
  formatDateTimeLocal,
} from '@/modules/chat/components/scheduleMessageUtils';
import { tweens, loop } from '@/lib/animation-presets';

interface ScheduleMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledAt: Date) => Promise<void>;
  messagePreview: string;
}

/**
 * ScheduleMessageModal Component
 *
 * Modal for scheduling messages to be sent at a future date/time.
 */
export function ScheduleMessageModal({
  isOpen,
  onClose,
  onSchedule,
  messagePreview,
}: ScheduleMessageModalProps) {
  const {
    scheduledAt,
    setScheduledAt,
    customDateTime,
    setCustomDateTime,
    isScheduling,
    handleClose,
    handleQuickSchedule,
    handleCustomDateTimeChange,
    handleSchedule,
    getMinDateTime,
    getMaxDateTime,
  } = useScheduleMessageModal({ isOpen, onClose, onSchedule });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={springs.stiff}
              className="w-full max-w-lg"
            >
              <GlassCard className="relative p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary-500/20 p-2">
                      <ClockIcon className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Schedule Message</h2>
                      <p className="text-sm text-gray-400">Choose when to send this message</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleClose}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Message Preview */}
                <div className="mb-6 rounded-xl bg-dark-800/50 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-300">Message Preview:</p>
                  <p className="line-clamp-3 text-white">{messagePreview}</p>
                </div>

                {/* Quick Schedule Buttons */}
                <div className="mb-6">
                  <p className="mb-3 text-sm font-medium text-gray-300">Quick Schedule:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_SCHEDULE_OPTIONS.map((option) => {
                      const resolved = resolveScheduleDate(option);
                      const isActive =
                        scheduledAt && customDateTime === formatDateTimeLocal(resolved);

                      return (
                        <motion.button
                          key={option.label}
                          onClick={() => {
                            if (option.time) {
                              const date = resolveScheduleDate(option);
                              setScheduledAt(date);
                              setCustomDateTime(formatDateTimeLocal(date));
                            } else {
                              handleQuickSchedule(option.duration);
                            }
                          }}
                          className={`group relative rounded-xl p-3 transition-all ${
                            isActive
                              ? 'bg-primary-500/20 text-primary-400 ring-2 ring-primary-500/50'
                              : 'bg-dark-800/50 text-gray-300 hover:bg-primary-500/10 hover:text-primary-400'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{option.icon}</span>
                            <span className="text-sm font-medium">{option.label}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Date/Time Picker */}
                <div className="mb-6">
                  <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                    <CalendarIcon className="h-4 w-4" />
                    Custom Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => handleCustomDateTimeChange(e.target.value)}
                    min={getMinDateTime()}
                    max={getMaxDateTime()}
                    className="w-full rounded-xl border border-gray-700 bg-dark-800/50 px-4 py-3 text-white transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </p>
                </div>

                {/* Scheduled Time Preview */}
                {scheduledAt && <ScheduledTimePreview scheduledAt={scheduledAt} />}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleClose}
                    className="flex-1 rounded-xl bg-dark-800/50 px-4 py-3 font-medium text-gray-300 transition-all hover:bg-dark-700/50 hover:text-white"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSchedule}
                    disabled={!scheduledAt || isScheduling}
                    className={`flex-1 rounded-xl px-4 py-3 font-medium transition-all ${
                      scheduledAt && !isScheduling
                        ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:from-primary-600 hover:to-purple-600'
                        : 'cursor-not-allowed bg-gray-700/50 text-gray-500'
                    }`}
                    whileHover={scheduledAt && !isScheduling ? { scale: 1.02 } : {}}
                    whileTap={scheduledAt && !isScheduling ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isScheduling ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={loop(tweens.slow)}
                            className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                          />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5" />
                          Schedule Message
                        </>
                      )}
                    </div>
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
