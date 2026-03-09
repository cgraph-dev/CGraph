/**
 * CGraph Modules - Component-Level Domain Organization
 *
 * This barrel export provides access to all module components.
 * Each module contains domain-specific components organized by feature.
 *
 * Module Structure:
 * - modules/auth/ - Authentication components
 * - modules/chat/ - Chat, messaging, conversation components
 * - modules/forums/ - Forum discussion components
 * - modules/groups/ - Group/server management components
 * - modules/social/ - Friends, presence, profile components
 * - modules/settings/ - User preferences components
 * - modules/calls/ - Voice/video call components
 * - modules/moderation/ - Mod tools components
 * - modules/premium/ - Premium/subscription components
 * - modules/search/ - Global search components
 * - modules/admin/ - Admin dashboard components
 *
 * Usage:
 * ```typescript
 * // Import from specific module (recommended)
 * import { MessageBubble, ChatInfoPanel } from '@/modules/chat';
 * ```
 *
 * Note: Import from specific modules to avoid naming conflicts.
 * The main index does not re-export to prevent duplicate name issues.
 *
 * @module @modules
 * @since v0.9.0
 */

// Module namespaces for direct access
export * as auth from './auth';
export * as chat from './chat';
export * as forums from './forums';
export * as groups from './groups';
// TODO(phase-26): Rewire — gamification module deleted
// export * as gamification from './gamification';
export * as social from './social';
export * as settings from './settings';
export * as calls from './calls';
export * as moderation from './moderation';
export * as premium from './premium';
export * as search from './search';
export * as admin from './admin';
export * as creator from './creator';
