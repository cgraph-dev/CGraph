/**
 * Moderation Hooks — Barrel Re-exports
 *
 * This file re-exports all moderation hooks from their submodules
 * so that existing imports from './useModeration' continue to work.
 *
 * @module modules/moderation/hooks
 * @version 2.0.0
 */

export {
  useModerationQueue,
  useUserWarnings,
  useBanManagement,
  useModerationLog,
} from './useModeration-queue';
export { useThreadModeration, usePostModeration } from './useModeration-actions';
export { useInlineModeration } from './useModeration-bulk';
