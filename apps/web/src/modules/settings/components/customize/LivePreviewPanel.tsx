/**
 * Live Preview Panel
 *
 * Real-time preview of all customization settings.
 * Shows profile card, avatar, and chat bubbles with live updates.
 *
 * Uses the unified customization store for all settings.
 *
 * @module LivePreviewPanel
 * @see ./live-preview-panel for modular implementation
 */

export {
  // Types
  type ChatBubbleProps,
  type ParticleData,
  type ParticleStyle,
  type MockBadge,
  type ThemeColors,
  // Constants
  ANIMATION_SPEED_MULTIPLIERS,
  MOCK_BADGES,
  PARTICLE_COLORS,
  LEGENDARY_TITLE_IDS,
  // Components
  ChatBubble,
  ProfileCardPreview,
  LivePreviewPanel,
  default,
} from './live-preview-panel';
