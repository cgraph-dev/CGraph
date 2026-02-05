/**
 * Type definitions for UI Customization Settings
 * @module modules/settings/components/ui-customization
 */

export interface UIPreferences {
  // Theme & Colors
  theme: 'dark' | 'darker' | 'midnight' | 'amoled' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundGradient: 'none' | 'subtle' | 'vibrant' | 'rainbow' | 'northern-lights';

  // Glass Effects
  glassEffect: 'none' | 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic' | 'matrix';
  glassBlur: number; // 0-50
  glassOpacity: number; // 0-100
  glassBorderWidth: number; // 0-5
  glowIntensity: number; // 0-100

  // Animations
  animationSpeed: 'instant' | 'fast' | 'normal' | 'slow' | 'very-slow';
  animationIntensity: 'minimal' | 'low' | 'medium' | 'high' | 'ultra';
  enableTransitions: boolean;
  enableHoverEffects: boolean;
  enable3DTransforms: boolean;
  enableParallax: boolean;

  // Particles & Effects
  particleSystem: 'none' | 'minimal' | 'medium' | 'heavy' | 'extreme';
  particleColor: 'primary' | 'rainbow' | 'monochrome' | 'custom';
  particleShape: 'circle' | 'square' | 'star' | 'heart' | 'custom';
  showAmbientEffects: boolean;
  showGlowEffects: boolean;
  showShadows: boolean;

  // Typography
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'system' | 'inter' | 'jetbrains' | 'comic-sans' | 'custom';
  fontWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  lineHeight: 'compact' | 'normal' | 'relaxed' | 'loose';
  letterSpacing: 'tight' | 'normal' | 'wide' | 'wider';

  // Spacing & Layout
  spacing: 'compact' | 'normal' | 'comfortable' | 'spacious';
  borderRadius: number; // 0-50
  contentWidth: 'narrow' | 'normal' | 'wide' | 'full';
  sidebarPosition: 'left' | 'right';

  // Performance
  reducedMotion: boolean;
  hardwareAcceleration: boolean;
  lazyLoadImages: boolean;
  virtualizeListsAtBeyond: number; // items

  // Accessibility
  highContrast: boolean;
  largeClickTargets: boolean;
  showFocusIndicators: boolean;
  enableHapticFeedback: boolean;
  enableSoundEffects: boolean;

  // Experimental
  enableNeuralEffects: boolean;
  enableQuantumUI: boolean;
  enableHolographicProjection: boolean;
  enableMindControl: boolean; // 😄
}

export const defaultPreferences: UIPreferences = {
  theme: 'dark',
  primaryColor: '#10b981',
  secondaryColor: '#8b5cf6',
  accentColor: '#ec4899',
  backgroundGradient: 'subtle',

  glassEffect: 'holographic',
  glassBlur: 20,
  glassOpacity: 15,
  glassBorderWidth: 1,
  glowIntensity: 50,

  animationSpeed: 'normal',
  animationIntensity: 'high',
  enableTransitions: true,
  enableHoverEffects: true,
  enable3DTransforms: true,
  enableParallax: true,

  particleSystem: 'medium',
  particleColor: 'primary',
  particleShape: 'circle',
  showAmbientEffects: true,
  showGlowEffects: true,
  showShadows: true,

  fontSize: 'medium',
  fontFamily: 'inter',
  fontWeight: 'normal',
  lineHeight: 'normal',
  letterSpacing: 'normal',

  spacing: 'normal',
  borderRadius: 12,
  contentWidth: 'normal',
  sidebarPosition: 'left',

  reducedMotion: false,
  hardwareAcceleration: true,
  lazyLoadImages: true,
  virtualizeListsAtBeyond: 100,

  highContrast: false,
  largeClickTargets: false,
  showFocusIndicators: true,
  enableHapticFeedback: true,
  enableSoundEffects: false,

  enableNeuralEffects: false,
  enableQuantumUI: false,
  enableHolographicProjection: false,
  enableMindControl: false,
};

// Settings component props interface
export interface SettingsTabProps {
  preferences: UIPreferences;
  updatePreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
}
