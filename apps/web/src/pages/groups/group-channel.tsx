/**
 * Group Channel Page
 *
 * Displays a group text channel with messages, members sidebar,
 * and input for sending new messages.
 *
 * Modularized into group-channel/ directory:
 * - types.ts: Component prop types and interfaces
 * - utils.ts: Date formatting, message grouping utilities
 * - ChannelHeader.tsx: Channel header with actions
 * - ChannelMessageItem.tsx: Individual message display
 * - MemberItem.tsx: Member list item
 * - MembersSidebar.tsx: Online/offline members sidebar
 * - MessageInput.tsx: Input area with reply preview
 * - MessagesArea.tsx: Message list with date grouping
 * - GroupChannel.tsx: Main page component
 *
 * @version 1.0.0
 * @since v0.9.2
 */
export { default } from './group-channel/index';
export * from './group-channel/index';
