/**
 * Event Form Module Types
 *
 * Type definitions for the calendar event form components.
 *
 * @module modules/social/components/event-form
 */

export interface EventFormProps {
  /** Event ID for editing an existing event (omit for new events) */
  eventId?: string;
  /** Pre-selected date when creating a new event */
  initialDate?: Date;
  /** Callback to close the form modal */
  onClose: () => void;
  /** Callback fired after successful event creation/update */
  onSuccess?: () => void;
}
