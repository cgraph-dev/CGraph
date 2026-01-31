import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  DocumentTextIcon,
  TagIcon,
  GlobeAltIcon,
  UsersIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useCalendarStore, EventFormData, RecurrencePattern } from '@/stores/calendarStore';
import { createLogger } from '@/lib/logger';

const logger = createLogger('EventForm');

/**
 * Event Form Component
 *
 * Create/Edit calendar events with:
 * - Title, description, location
 * - Start/end date/time
 * - All-day toggle
 * - Category selection
 * - Visibility (public/private/invite-only)
 * - Recurrence options
 * - Max attendees
 */

interface EventFormProps {
  eventId?: string; // If editing
  initialDate?: Date;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EventForm({ eventId, initialDate, onClose, onSuccess }: EventFormProps) {
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

  // Format datetime for input
  const formatDateTimeLocal = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  };

  // Format date for input
  const formatDateLocal = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 10);
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border-border max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border shadow-xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="text-foreground text-xl font-semibold">
            {eventId ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} className="hover:bg-muted rounded-lg p-2 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Event Title *
              </label>
              <div className="relative">
                <CalendarIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter event title"
                  className={`bg-background focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 ${
                    errors.title ? 'border-destructive' : 'border-border'
                  }`}
                />
              </div>
              {errors.title && <p className="text-destructive mt-1 text-sm">{errors.title}</p>}
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allDay"
                name="allDay"
                checked={formData.allDay}
                onChange={handleChange}
                className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
              />
              <label
                htmlFor="allDay"
                className="text-foreground cursor-pointer text-sm font-medium"
              >
                All-day event
              </label>
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Start {formData.allDay ? 'Date' : 'Date & Time'} *
                </label>
                <div className="relative">
                  <ClockIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                  <input
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={
                      formData.allDay
                        ? formatDateLocal(formData.startDate)
                        : formatDateTimeLocal(formData.startDate)
                    }
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className={`bg-background focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 ${
                      errors.startDate ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-destructive mt-1 text-sm">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  End {formData.allDay ? 'Date' : 'Date & Time'}
                </label>
                <div className="relative">
                  <ClockIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                  <input
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={
                      formData.allDay
                        ? formatDateLocal(formData.endDate || '')
                        : formatDateTimeLocal(formData.endDate || '')
                    }
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className={`bg-background focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 ${
                      errors.endDate ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
                {errors.endDate && (
                  <p className="text-destructive mt-1 text-sm">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Location</label>
              <div className="relative">
                <MapPinIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Add location (optional)"
                  className="bg-background border-border focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Description</label>
              <div className="relative">
                <DocumentTextIcon className="text-muted-foreground absolute left-3 top-3 h-5 w-5" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add description (optional)"
                  rows={4}
                  className="bg-background border-border focus:ring-primary w-full resize-none rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Category & Visibility */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Category</label>
                <div className="relative">
                  <TagIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                  <select
                    name="categoryId"
                    value={formData.categoryId || ''}
                    onChange={handleChange}
                    className="bg-background border-border focus:ring-primary w-full appearance-none rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Visibility</label>
                <div className="relative">
                  <GlobeAltIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="bg-background border-border focus:ring-primary w-full appearance-none rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
                  >
                    <option value="public">🌐 Public</option>
                    <option value="members">👥 Members Only</option>
                    <option value="invite">🔒 Invite Only</option>
                    <option value="private">🔐 Private</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Repeat</label>
              <div className="relative">
                <ArrowPathIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                <select
                  value={formData.recurrence?.pattern || ''}
                  onChange={(e) => handleRecurrenceChange(e.target.value as RecurrencePattern | '')}
                  className="bg-background border-border focus:ring-primary w-full appearance-none rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
                >
                  <option value="">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Max Attendees */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Max Attendees
              </label>
              <div className="relative">
                <UsersIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees || ''}
                  onChange={handleChange}
                  placeholder="Unlimited"
                  min="1"
                  className="bg-background border-border focus:ring-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2"
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Leave empty for unlimited attendees
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg border p-3 text-sm">
                {errors.submit}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-border mt-6 flex items-center justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={onClose}
              className="text-foreground bg-secondary hover:bg-secondary/80 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : eventId ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
