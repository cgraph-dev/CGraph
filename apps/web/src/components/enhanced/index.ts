/**
 * Enhanced Components Index
 *
 * Central export point for all v2.0 enhanced components.
 * Import from here for convenience.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

// Animation System
export { AnimationEngine, SpringPhysics, HapticFeedback, GestureHandler, ANIMATION_PRESETS } from '@/lib/animations/AnimationEngine';
export type { AnimationConfig, SpringConfig, GestureConfig, SequenceStep } from '@/lib/animations/AnimationEngine';

// AI Theme Engine
export { themeEngine, AIThemeEngine } from '@/lib/ai/ThemeEngine';
export type { ThemeColors, ThemeMetadata, AdaptiveTheme, UserPreference } from '@/lib/ai/ThemeEngine';

// UI Components
export { default as GlassCard, GlassCardNeon, GlassCardHolographic, GlassCardCrystal } from '@/components/ui/GlassCard';
export type { GlassCardProps } from '@/components/ui/GlassCard';

// Conversation Components
export { AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';
export type { AnimatedMessageWrapperProps } from '@/components/conversation/AnimatedMessageWrapper';

export { AnimatedReactionBubble, ReactionPicker } from '@/components/conversation/AnimatedReactionBubble';
export type { AnimatedReactionBubbleProps, ReactionData } from '@/components/conversation/AnimatedReactionBubble';

// 3D Components
export { default as Matrix3DEnvironment, Matrix3DLowProfile, Matrix3DCyberBlue } from '@/components/three/Matrix3DEnvironment';
export type { Matrix3DEnvironmentProps } from '@/components/three/Matrix3DEnvironment';

// Audio Components
export { default as AdvancedVoiceVisualizer } from '@/components/audio/AdvancedVoiceVisualizer';
export type { AdvancedVoiceVisualizerProps } from '@/components/audio/AdvancedVoiceVisualizer';

// Shader Components
export { default as ShaderBackground, MatrixShaderBackground, CyberShaderBackground, NeuralShaderBackground } from '@/components/shaders/ShaderBackground';
export type { ShaderBackgroundProps } from '@/components/shaders/ShaderBackground';

// Pages
export { default as EnhancedConversation } from '@/pages/messages/EnhancedConversation';
