import { useState, useEffect, useCallback } from 'react';
import { add, format, isBefore, isAfter, addHours, type Duration } from 'date-fns';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { toast } from '@/shared/components/ui';

const logger = createLogger('ScheduleMessageModal');

const DATE_FORMAT = "yyyy-MM-dd'T'HH:mm";

export interface UseScheduleMessageModalOptions {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledAt: Date) => Promise<void>;
}

export function useScheduleMessageModal({
  isOpen,
  onClose,
  onSchedule,
}: UseScheduleMessageModalOptions) {
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [customDateTime, setCustomDateTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Initialize with 1 hour from now
  useEffect(() => {
    if (isOpen) {
      const oneHourLater = addHours(new Date(), 1);
      setScheduledAt(oneHourLater);
      setCustomDateTime(format(oneHourLater, DATE_FORMAT));
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setScheduledAt(null);
    setCustomDateTime('');
    onClose();
  }, [onClose]);

  const handleQuickSchedule = useCallback((duration: Duration) => {
    const scheduledTime = add(new Date(), duration);
    setScheduledAt(scheduledTime);
    setCustomDateTime(format(scheduledTime, DATE_FORMAT));
    HapticFeedback.light();
  }, []);

  const handleCustomDateTimeChange = useCallback((dateTimeString: string) => {
    setCustomDateTime(dateTimeString);
    const selectedDate = new Date(dateTimeString);

    if (isBefore(selectedDate, new Date())) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    const oneYearFromNow = add(new Date(), { years: 1 });
    if (isAfter(selectedDate, oneYearFromNow)) {
      toast.error('Cannot schedule more than 1 year in advance');
      return;
    }

    setScheduledAt(selectedDate);
  }, []);

  const handleSchedule = useCallback(async () => {
    if (!scheduledAt || isScheduling) return;

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
  }, [scheduledAt, isScheduling, onSchedule, handleClose]);

  const getMinDateTime = useCallback(() => format(new Date(), DATE_FORMAT), []);

  const getMaxDateTime = useCallback(() => format(add(new Date(), { years: 1 }), DATE_FORMAT), []);

  return {
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
  };
}
