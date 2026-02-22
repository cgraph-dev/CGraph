/**
 * Event Form Module
 *
 * Calendar event creation and editing form with date/time pickers,
 * recurrence patterns, location, and category support.
 *
 * @module modules/social/components/event-form
 */

// Main component
export { default } from './event-form';

// Sub-components
export { default as DateTimeFields } from './date-time-fields';
export { default as EventFormFields } from './event-form-fields';

// Hooks
export { useEventForm, formatDateTimeLocal, formatDateLocal } from './hooks';

// Types
export type { EventFormProps } from './types';
