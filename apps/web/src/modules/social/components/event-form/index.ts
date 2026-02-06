/**
 * Event Form Module
 *
 * Calendar event creation and editing form with date/time pickers,
 * recurrence patterns, location, and category support.
 *
 * @module modules/social/components/event-form
 */

// Main component
export { default } from './EventForm';

// Sub-components
export { default as DateTimeFields } from './DateTimeFields';
export { default as EventFormFields } from './EventFormFields';

// Hooks
export { useEventForm, formatDateTimeLocal, formatDateLocal } from './hooks';

// Types
export type { EventFormProps } from './types';
