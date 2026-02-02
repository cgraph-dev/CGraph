import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ScheduleMessageModal');
import { ClockIcon, XMarkIcon, CalendarIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { add, format, isBefore, isAfter, addHours, type Duration } from 'date-fns';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { toast } from '@/components/Toast';

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
 *
 * Features:
 * - Date/time picker for custom scheduling
 * - Quick scheduling buttons (1 hour, tomorrow, next week)
 * - Timezone display
 * - Validation (future time only, max 1 year)
 * - Message preview
 * - Glassmorphism design
 */
export function ScheduleMessageModal({
  isOpen,
  onClose,
  onSchedule,
  messagePreview,
}: ScheduleMessageModalProps) {
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [customDateTime, setCustomDateTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Initialize with 1 hour from now
  useEffect(() => {
    if (isOpen) {
      const oneHourLater = addHours(new Date(), 1);
      setScheduledAt(oneHourLater);
      setCustomDateTime(format(oneHourLater, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [isOpen]);

  const handleQuickSchedule = (duration: Duration) => {
    const scheduledTime = add(new Date(), duration);
    setScheduledAt(scheduledTime);
    setCustomDateTime(format(scheduledTime, "yyyy-MM-dd'T'HH:mm"));
    HapticFeedback.light();
  };

  const handleCustomDateTimeChange = (dateTimeString: string) => {
    setCustomDateTime(dateTimeString);
    const selectedDate = new Date(dateTimeString);

    // Validate it's a future date
    if (isBefore(selectedDate, new Date())) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    // Validate it's not more than 1 year in the future
    const oneYearFromNow = add(new Date(), { years: 1 });
    if (isAfter(selectedDate, oneYearFromNow)) {
      toast.error('Cannot schedule more than 1 year in advance');
      return;
    }

    setScheduledAt(selectedDate);
  };

  const handleSchedule = async () => {
    if (!scheduledAt || isScheduling) return;

    // Final validation
    if (isBefore(scheduledAt, new Date())) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    setIsScheduling(true);
    try {
      await onSchedule(scheduledAt);
      toast.success(`Message scheduled for ${format(scheduledAt, 'PPpp')}`);
      HapticFeedback.success();
      handleClose();
    } catch (error) {
      logger.error('Failed to schedule message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule message';
      toast.error(errorMessage);
      HapticFeedback.error();
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClose = () => {
    setScheduledAt(null);
    setCustomDateTime('');
    onClose();
  };

  // Quick schedule options
  const quickScheduleOptions = [
    { label: '1 hour', duration: { hours: 1 }, icon: '⏰' },
    { label: '3 hours', duration: { hours: 3 }, icon: '⏰' },
    { label: 'Tomorrow 9am', duration: { days: 1 }, time: '09:00', icon: '🌅' },
    { label: 'Next week', duration: { weeks: 1 }, icon: '📅' },
  ];

  const getMinDateTime = () => {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  };

  const getMaxDateTime = () => {
    return format(add(new Date(), { years: 1 }), "yyyy-MM-dd'T'HH:mm");
  };

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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
                    {quickScheduleOptions.map((option) => {
                      const isActive =
                        scheduledAt &&
                        customDateTime ===
                          format(
                            option.time
                              ? (() => {
                                  const date = add(new Date(), option.duration);
                                  const [hours = '0', minutes = '0'] = option.time.split(':');
                                  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                  if (isBefore(date, new Date())) {
                                    date.setDate(date.getDate() + 1);
                                  }
                                  return date;
                                })()
                              : add(new Date(), option.duration),
                            "yyyy-MM-dd'T'HH:mm"
                          );

                      return (
                        <motion.button
                          key={option.label}
                          onClick={() => {
                            if (option.time) {
                              const date = add(new Date(), option.duration);
                              const [hours = '0', minutes = '0'] = option.time.split(':');
                              date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                              // If the time has passed today, schedule for tomorrow
                              if (isBefore(date, new Date())) {
                                date.setDate(date.getDate() + 1);
                              }
                              setScheduledAt(date);
                              setCustomDateTime(format(date, "yyyy-MM-dd'T'HH:mm"));
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
                {scheduledAt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-xl border border-primary-500/20 bg-gradient-to-r from-primary-500/10 to-purple-500/10 p-4"
                  >
                    <p className="mb-1 text-sm font-medium text-gray-300">Message will be sent:</p>
                    <p className="text-lg font-bold text-white">
                      {format(scheduledAt, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-md text-primary-400">at {format(scheduledAt, 'h:mm a')}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {(() => {
                        const now = new Date();
                        const diff = scheduledAt.getTime() - now.getTime();
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                        if (hours < 24) {
                          return `in ${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
                        } else {
                          const days = Math.floor(hours / 24);
                          return `in ${days} day${days !== 1 ? 's' : ''}`;
                        }
                      })()}
                    </p>
                  </motion.div>
                )}

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
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
