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
  const {
    events,
    categories,
    isLoading,
    createEvent,
    updateEvent,
    fetchEvent,
  } = useCalendarStore();

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
      console.error('[EventForm] Failed to save event:', error);
      setErrors({ submit: 'Failed to save event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {eventId ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Event Title *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter event title"
                  className={`w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.title ? 'border-destructive' : 'border-border'
                  }`}
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allDay"
                name="allDay"
                checked={formData.allDay}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="allDay" className="text-sm font-medium text-foreground cursor-pointer">
                All-day event
              </label>
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Start {formData.allDay ? 'Date' : 'Date & Time'} *
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={formData.allDay ? formatDateLocal(formData.startDate) : formatDateTimeLocal(formData.startDate)}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.startDate ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
                {errors.startDate && (
                  <p className="mt-1 text-sm text-destructive">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  End {formData.allDay ? 'Date' : 'Date & Time'}
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={formData.allDay ? formatDateLocal(formData.endDate || '') : formatDateTimeLocal(formData.endDate || '')}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.endDate ? 'border-destructive' : 'border-border'
                    }`}
                  />
                </div>
                {errors.endDate && (
                  <p className="mt-1 text-sm text-destructive">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Location
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Add location (optional)"
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <div className="relative">
                <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add description (optional)"
                  rows={4}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            {/* Category & Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <div className="relative">
                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <select
                    name="categoryId"
                    value={formData.categoryId || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  Visibility
                </label>
                <div className="relative">
                  <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
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
              <label className="block text-sm font-medium text-foreground mb-1">
                Repeat
              </label>
              <div className="relative">
                <ArrowPathIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <select
                  value={formData.recurrence?.pattern || ''}
                  onChange={(e) => handleRecurrenceChange(e.target.value as RecurrencePattern | '')}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
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
              <label className="block text-sm font-medium text-foreground mb-1">
                Max Attendees
              </label>
              <div className="relative">
                <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees || ''}
                  onChange={handleChange}
                  placeholder="Unlimited"
                  min="1"
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty for unlimited attendees
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : eventId ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
