/**
 * Shared Utilities - Single Export Point
 *
 * Re-exports commonly used utility functions.
 * Import from '@/shared/utils' for module-based architecture.
 *
 * @module @shared/utils
 */

// Core utilities - class name merging, date formatting, etc.
export { cn, safeParseDate, formatTimeAgo, formatBytes, getAvatarBorderId } from '@/lib/utils';

// Error display utilities
export {
  getDisplayError,
  isRenderableError,
  toErrorString,
  createErrorHandler,
} from '@/utils/errorDisplay';

// URL security utilities
export {
  isValidLinkUrl,
  isValidImageUrl,
  sanitizeLinkUrl,
  sanitizeImageUrl,
  isValidExternalUrl,
  escapeHtml,
} from '@/utils/urlSecurity';
