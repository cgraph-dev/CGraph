/**
 * Enhanced Components Index
 *
 * Central export point for all v2.0, v3.0, and v4.0 enhanced components.
 * Import from here for convenience.
 *
 * @version 4.0.0
 * @since v0.7.33
 * @updated v0.8.3
 */

// =============================================================================
// HOLOGRAPHIC UI SYSTEM v4.0
// =============================================================================

export {
  HoloProvider,
  useHolo,
  HoloContainer,
  HoloText,
  HoloButton,
  HoloCard,
  HoloAvatar,
  HoloInput,
  HoloProgress,
  HoloBadge,
  HoloTabs,
  HoloDivider,
  HoloModal,
  HoloNotification,
  HoloTooltip,
  HOLO_PRESETS,
  holoStyles,
} from './ui';

export type { HoloTheme, HoloConfig } from './ui/holographic-ui-v4/index';

// App-level Holographic Provider
export {
  AppHoloProvider,
  defaultHoloConfig,
  performanceHoloConfig,
  accessibleHoloConfig,
  premiumHoloConfig,
} from './app-holo-provider';

// =============================================================================
// ANIMATION SYSTEM
// =============================================================================

export {
  AnimationEngine,
  SpringPhysics,
  HapticFeedback,
  GestureHandler,
  ANIMATION_PRESETS,
} from '@/lib/animations/animation-engine';
export type {
  AnimationConfig,
  SpringConfig,
  GestureConfig,
  SequenceStep,
} from '@/lib/animations/animation-engine';

// =============================================================================
// AI SYSTEMS
// =============================================================================

// Theme Engine
export { themeEngine, AIThemeEngine } from '@/lib/ai/theme-engine';
export type {
  ThemeColors,
  ThemeMetadata,
  AdaptiveTheme,
  UserPreference,
} from '@/lib/ai/theme-engine';

// AI Message Intelligence (NEW v0.7.35)
export { AIMessageEngine, aiMessageEngine } from '@/lib/ai/ai-message-engine';
export type {
  SmartReply,
  MessageSummary,
  SentimentAnalysis,
  LanguageDetection,
  ContentModeration,
  ConversationInsight,
  TopicExtraction,
} from '@/lib/ai/ai-message-engine';

// =============================================================================
// SECURITY & CRYPTOGRAPHY
// =============================================================================

// Triple Ratchet Protocol (v0.9.28 — Post-Quantum upgrade)
export {
  DoubleRatchetEngine,
  PostQuantumDoubleRatchet,
  generateDHKeyPair,
  importDHPublicKey,
} from '@/lib/crypto/doubleRatchet';
export type {
  RatchetState,
  MessageHeader,
  EncryptedMessage,
  DecryptedMessage,
  RatchetConfig,
} from '@/lib/crypto/doubleRatchet';

// =============================================================================
// AUDIO SYSTEMS
// =============================================================================

// Advanced Voice Visualizer
export { default as AdvancedVoiceVisualizer } from '@/modules/chat/components/audio/advanced-voice-visualizer';
export type { AdvancedVoiceVisualizerProps } from '@/modules/chat/components/audio/advanced-voice-visualizer';

// Spatial Audio Engine (NEW v0.7.35)
export {
  SpatialAudioEngine,
  SpatialAudioRoom,
  spatialAudioEngine,
} from '@/lib/audio/spatial-audio-engine';
export type {
  Position3D,
  Orientation3D,
  AudioSource,
  AudioZone,
  ReverbConfig,
  VoiceActivityState,
  SpatialAudioConfig,
  AudioAnalysisResult,
} from '@/lib/audio/spatial-audio-engine';

// =============================================================================
// UI COMPONENTS
// =============================================================================

// Glass Card
export {
  default as GlassCard,
  GlassCardNeon,
  GlassCardHolographic,
  GlassCardCrystal,
} from '@/components/ui/glass-card';
export type { GlassCardProps } from '@/components/ui/glass-card';

// Holographic UI (NEW v0.7.35)
export {
  HolographicContainer,
  HolographicText,
  HolographicButton,
  HolographicCard,
  HolographicAvatar,
  HolographicInput,
  HolographicProgress,
  HolographicNotification,
  HOLOGRAPHIC_THEMES,
  holographicStyles,
} from '@/components/enhanced/ui/holographic-ui';
export type { HolographicTheme, HolographicConfig } from '@/components/enhanced/ui/holographic-ui';

// =============================================================================
// CONVERSATION COMPONENTS
// =============================================================================

export { AnimatedMessageWrapper } from '@/modules/chat/components/animated-message-wrapper';
export type { AnimatedMessageWrapperProps } from '@/modules/chat/components/animated-message-wrapper';

export {
  AnimatedReactionBubble,
  ReactionPicker,
} from '@/modules/chat/components/animated-reaction-bubble';
export type {
  AnimatedReactionBubbleProps,
  ReactionData,
} from '@/modules/chat/components/animated-reaction-bubble';

// =============================================================================
// 3D COMPONENTS — lazy-loaded to avoid pulling Three.js (~600KB) into main bundle
// Import directly from '@/components/three/Matrix3DEnvironment' with React.lazy()
// =============================================================================
export type { Matrix3DEnvironmentProps } from '@/components/three/matrix3-d-environment';

// =============================================================================
// SHADER COMPONENTS
// =============================================================================

export {
  default as ShaderBackground,
  MatrixShaderBackground,
  CyberShaderBackground,
  NeuralShaderBackground,
} from '@/components/shaders/shader-background';
export type { ShaderBackgroundProps } from '@/components/shaders/shader-background';

// =============================================================================
// PAGES
// =============================================================================

export { default as EnhancedConversation } from '@/pages/messages/enhanced-conversation';
