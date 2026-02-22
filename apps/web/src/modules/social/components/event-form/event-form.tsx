import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import type { EventFormProps } from './types';
import { useEventForm } from './hooks';
import DateTimeFields from './date-time-fields';
import EventFormFields from './event-form-fields';

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
export default function EventForm(props: EventFormProps) {
  const { eventId, onClose } = props;
  const {
    formData,
    errors,
    isSubmitting,
    isLoading,
    categories,
    handleChange,
    handleDateChange,
    handleRecurrenceChange,
    handleSubmit,
  } = useEventForm(props);

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

            <DateTimeFields
              formData={formData}
              errors={errors}
              handleChange={handleChange}
              handleDateChange={handleDateChange}
            />

            <EventFormFields
              formData={formData}
              handleChange={handleChange}
              handleRecurrenceChange={handleRecurrenceChange}
              categories={categories}
            />

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
