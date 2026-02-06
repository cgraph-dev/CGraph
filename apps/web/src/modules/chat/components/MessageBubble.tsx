/**
 * MessageBubble - Memoized message display component
 *
 * Displays individual chat messages with all media types, reactions, and actions.
 *
 * Modularized into message-bubble/ directory:
 * - types.ts: Type definitions for props and interfaces
 * - utils.ts: Helper functions (formatMessageTime, handleAddReaction)
 * - icons.tsx: SVG icon components (Reply, Edit, Pin, Forward, Delete)
 * - ReadReceipts.tsx: Displays read receipt avatars
 * - MessageEditForm.tsx: Inline editing form
 * - MessageActionMenu.tsx: Dropdown menu for message actions
 * - MessageBubble.tsx: Main memoized component
 */
export { MessageBubble, default } from './message-bubble';
export * from './message-bubble';
