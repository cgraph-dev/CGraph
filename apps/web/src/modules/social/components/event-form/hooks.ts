/**
 * Event form state management hooks.
 * @module
 */
import { useState, useEffect } from 'react';
import { useCalendarStore, EventFormData, RecurrencePattern } from '@/modules/settings/store';
import { createLogger } from '@/lib/logger';
import type { EventFormProps } from './types';

const logger = createLogger('EventForm');

// Format datetime for input
function formatDateTimeLocal(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toISOString().slice(0, 16);
}

// Format date for input
function formatDateLocal(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toISOString().slice(0, 10);
}

export { formatDateTimeLocal, formatDateLocal };

export function useEventForm({ eventId, initialDate, onClose, onSuccess }: EventFormProps) {
  const { events, categories, isLoading, createEvent, updateEvent, fetchEvent } =
    useCalendarStore();

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: initialDate?.toISOString() || new Date().toISOString(),
    endDate: '',
    allDay: false,
    type: 'single',
    visibility: 'public',
    location: '',
    categoryId: '',
    maxAttendees: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load event data if editing
  useEffect(() => {
    if (eventId) {
      const existingEvent = events.find((e) => e.id === eventId);
      if (existingEvent) {
        setFormData({
          title: existingEvent.title,
          description: existingEvent.description || '',
          startDate: existingEvent.startDate,
          endDate: existingEvent.endDate || '',
          allDay: existingEvent.allDay,
          type: existingEvent.type,
          visibility: existingEvent.visibility,
          location: existingEvent.location || '',
          categoryId: existingEvent.categoryId || '',
          maxAttendees: existingEvent.maxAttendees,
          recurrence: existingEvent.recurrence,
        });
      } else {
        // Fetch from API if not in store
        fetchEvent(eventId);
      }
    }
  }, [eventId, events, fetchEvent]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    // type assertion: checkbox event target is HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle date change
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    let isoDate = '';
    if (value) {
      if (formData.allDay) {
        isoDate = new Date(value + 'T00:00:00').toISOString();
      } else {
        isoDate = new Date(value).toISOString();
      }
    }
    setFormData((prev) => ({ ...prev, [field]: isoDate }));
  };

  // Handle recurrence change
  const handleRecurrenceChange = (pattern: RecurrencePattern | '') => {
    if (!pattern) {
      setFormData((prev) => ({
        ...prev,
        recurrence: undefined,
        type: 'single',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        recurrence: {
          pattern,
          interval: 1,
        },
        type: 'recurring',
      }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (eventId) {
        await updateEvent(eventId, formData);
      } else {
        await createEvent(formData);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('[EventForm] Failed to save event:', error);
      setErrors({ submit: 'Failed to save event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    isLoading,
    categories,
    handleChange,
    handleDateChange,
    handleRecurrenceChange,
    handleSubmit,
  };
}
