/**
 * Live Preview Panel Module
 *
 * Real-time preview of customization settings including
 * profile card, avatar borders, and chat bubbles.
 */

// Types
export type {
  ChatBubbleProps,
  ParticleData,
  ParticleStyle,
  PreviewBadge,
  ThemeColors,
} from './types';

// Constants
export {
  ANIMATION_SPEED_MULTIPLIERS,
  PREVIEW_BADGES,
  PARTICLE_COLORS,
  LEGENDARY_TITLE_IDS,
} from './constants';

// Components
export { ChatBubble } from './chat-bubble';
export { ProfileCardPreview } from './profile-card-preview';
export { LivePreviewPanel, default } from './live-preview-panel';
