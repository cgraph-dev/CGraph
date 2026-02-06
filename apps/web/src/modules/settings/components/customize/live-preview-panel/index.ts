/**
 * Live Preview Panel Module
 *
 * Real-time preview of customization settings including
 * profile card, avatar borders, and chat bubbles.
 */

// Types
export type { ChatBubbleProps, ParticleData, ParticleStyle, MockBadge, ThemeColors } from './types';

// Constants
export {
  ANIMATION_SPEED_MULTIPLIERS,
  MOCK_BADGES,
  PARTICLE_COLORS,
  LEGENDARY_TITLE_IDS,
} from './constants';

// Components
export { ChatBubble } from './ChatBubble';
export { ProfileCardPreview } from './ProfileCardPreview';
export { LivePreviewPanel, default } from './LivePreviewPanel';
