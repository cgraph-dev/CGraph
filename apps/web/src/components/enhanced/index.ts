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

export type { HoloTheme, HoloConfig } from './ui/HolographicUIv4';

// App-level Holographic Provider
export { 
  AppHoloProvider, 
  defaultHoloConfig, 
  performanceHoloConfig, 
  accessibleHoloConfig,
  premiumHoloConfig 
} from './AppHoloProvider';

// =============================================================================
// ANIMATION SYSTEM
// =============================================================================

export { AnimationEngine, SpringPhysics, HapticFeedback, GestureHandler, ANIMATION_PRESETS } from '@/lib/animations/AnimationEngine';
export type { AnimationConfig, SpringConfig, GestureConfig, SequenceStep } from '@/lib/animations/AnimationEngine';

// =============================================================================
// AI SYSTEMS
// =============================================================================

// Theme Engine
export { themeEngine, AIThemeEngine } from '@/lib/ai/ThemeEngine';
export type { ThemeColors, ThemeMetadata, AdaptiveTheme, UserPreference } from '@/lib/ai/ThemeEngine';

// AI Message Intelligence (NEW v0.7.35)
export { AIMessageEngine, aiMessageEngine } from '@/lib/ai/AIMessageEngine';
export type {
  SmartReply,
  MessageSummary,
  SentimentAnalysis,
  LanguageDetection,
  ContentModeration,
  ConversationInsight,
  TopicExtraction,
} from '@/lib/ai/AIMessageEngine';

// =============================================================================
// SECURITY & CRYPTOGRAPHY
// =============================================================================

// Double Ratchet Protocol (NEW v0.7.35)
export { DoubleRatchetEngine, PostQuantumDoubleRatchet, generateDHKeyPair, importDHPublicKey } from '@/lib/crypto/doubleRatchet';
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
export { default as AdvancedVoiceVisualizer } from '@/components/audio/AdvancedVoiceVisualizer';
export type { AdvancedVoiceVisualizerProps } from '@/components/audio/AdvancedVoiceVisualizer';

// Spatial Audio Engine (NEW v0.7.35)
export { SpatialAudioEngine, SpatialAudioRoom, spatialAudioEngine } from '@/lib/audio/SpatialAudioEngine';
export type {
  Position3D,
  Orientation3D,
  AudioSource,
  AudioZone,
  ReverbConfig,
  VoiceActivityState,
  SpatialAudioConfig,
  AudioAnalysisResult,
} from '@/lib/audio/SpatialAudioEngine';

// =============================================================================
// UI COMPONENTS
// =============================================================================

// Glass Card
export { default as GlassCard, GlassCardNeon, GlassCardHolographic, GlassCardCrystal } from '@/components/ui/GlassCard';
export type { GlassCardProps } from '@/components/ui/GlassCard';

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
} from '@/components/enhanced/ui/HolographicUI';
export type { HolographicTheme, HolographicConfig } from '@/components/enhanced/ui/HolographicUI';

// =============================================================================
// CONVERSATION COMPONENTS
// =============================================================================

export { AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';
export type { AnimatedMessageWrapperProps } from '@/components/conversation/AnimatedMessageWrapper';

export { AnimatedReactionBubble, ReactionPicker } from '@/components/conversation/AnimatedReactionBubble';
export type { AnimatedReactionBubbleProps, ReactionData } from '@/components/conversation/AnimatedReactionBubble';

// =============================================================================
// 3D COMPONENTS
// =============================================================================

export { default as Matrix3DEnvironment, Matrix3DLowProfile, Matrix3DCyberBlue } from '@/components/three/Matrix3DEnvironment';
export type { Matrix3DEnvironmentProps } from '@/components/three/Matrix3DEnvironment';

// =============================================================================
// SHADER COMPONENTS
// =============================================================================

export { default as ShaderBackground, MatrixShaderBackground, CyberShaderBackground, NeuralShaderBackground } from '@/components/shaders/ShaderBackground';
export type { ShaderBackgroundProps } from '@/components/shaders/ShaderBackground';

// =============================================================================
// PAGES
// =============================================================================

export { default as EnhancedConversation } from '@/pages/messages/EnhancedConversation';

