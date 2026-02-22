/**
 * Messages Page
 *
 * Main messages page with conversation sidebar and content area.
 * Features real-time online status, message search, and
 * direct message creation from user IDs.
 *
 * Modularized into messages/ directory:
 * - types.ts: OnlineStatusMap, component prop interfaces
 * - utils.ts: getConversationName, getConversationAvatar, filterConversations
 * - ConversationItem.tsx: Single conversation list item
 * - ConversationSidebar.tsx: Sidebar with search and list
 * - EmptyStates.tsx: Loading, empty list, no selection states
 * - Messages.tsx: Main page component
 *
 * @version 1.0.0
 * @since v0.9.0
 */
export { default } from './messages/index';
export * from './messages/index';
