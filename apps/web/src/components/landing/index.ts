/**
 * Landing Page Components
 *
 * Modular, reusable components for building stunning landing pages.
 * Easy to customize and compatible with reactbits.dev / 21st.dev patterns.
 *
 * Usage:
 *   import { ParticleNetwork, GlowText, TiltCard } from '@/components/landing';
 *   import { fadeInUp, springs, staggerContainer } from '@/components/landing';
 */

// =============================================================================
// VISUAL EFFECTS
// =============================================================================

export {
  // Particle effects
  ParticleNetwork,

  // Background effects
  GradientOrb,
  GradientBackground,
  GridBackground,
  DotBackground,
  Scanlines,

  // Text effects
  GlowText,
  TypingText,

  // Interactive effects
  AnimatedBorder,
  TiltCard,
  Magnetic,
  Spotlight,

  // Counters
  AnimatedCounter,
} from './effects';

// =============================================================================
// ADVANCED EFFECTS
// =============================================================================

export {
  // Noise & shader effects
  NoiseOverlay,
  ChromaticText,
  DistortionWave,

  // 3D parallax
  ParallaxLayer,
  ParallaxScene,
  Float3D,

  // Morphing & liquid
  MorphingBlob,
  LiquidGradient,

  // Cursor effects
  CursorTrail,
  MagneticCursor,

  // Text animations
  TextScramble,
  GlitchText,
  RevealText,

  // Background effects
  AuroraBackground,
  SpotlightReveal,

  // Scroll effects
  VelocityText,

  // Cards
  HolographicCard,

  // Layout
  StaggeredGrid,
  InfiniteMarquee,
} from './advanced-effects';

// =============================================================================
// WEBGL EFFECTS
// =============================================================================

export {
  // Shader backgrounds
  ShaderBackground,
  Metaballs,

  // Patterns
  GeometricPattern,
  Constellation,

  // Animations
  Vortex,
  WaveMesh,
  DNAHelix,
} from './webgl-effects';

// =============================================================================
// SHOWCASE COMPONENTS
// =============================================================================

export {
  // 3D cards
  CardStack,
  FloatingCard,

  // Scroll animations
  ScrollTimeline,
  HorizontalScroll,
  ScrollProgress,
  RevealContainer,
  ScrollCounter,
  ParallaxImage,

  // Text animations
  SplitText,

  // Grids & layouts
  MagneticGrid,
  BentoGrid,

  // Interactive
  PerspectiveTilt,
  AnimatedTabs,

  // Testimonials
  TestimonialCarousel,
} from './showcase-components';

// =============================================================================
// ANIMATIONS
// =============================================================================

export {
  // Spring presets
  springs,

  // Entrance animations
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleInBounce,
  rotateIn,
  slideInFromBottom,
  flipIn,
  blurIn,

  // Stagger containers
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,

  // Hover animations
  hoverScale,
  hoverScaleLarge,
  hoverLift,
  hoverGlow,
  hoverRotate,

  // Tap animations
  tapScale,
  tapScaleSmall,
  tapBounce,

  // Continuous animations
  pulse,
  float,
  glow,
  rotate360,
  breathe,
  shimmer,
  wave,

  // Scroll-triggered
  scrollFadeIn,
  scrollScaleIn,
  scrollSlideIn,

  // Text animations
  textRevealContainer,
  textRevealChar,
  textTypewriter,

  // 3D animations
  perspective3D,
  cardFlip,
  tiltOnHover,

  // Utilities
  withDelay,
  createStagger,
  createScrollTrigger,
} from './animations';

// =============================================================================
// DEMO COMPONENTS (use dynamic imports for code-splitting)
// =============================================================================

// CustomizationDemo is dynamically imported in LandingPageOptimized
// Use: const CustomizationDemo = lazy(() => import('./CustomizationDemo'));

// InteractiveDemo for live feature demonstration
export { InteractiveDemo, type default as InteractiveDemoDefault } from './InteractiveDemo';

// =============================================================================
// SHOWCASE SECTIONS (use dynamic imports for code-splitting)
// =============================================================================

// ForumShowcase is dynamically imported in LandingPageOptimized
// Use: const ForumShowcase = lazy(() => import('./ForumShowcase'));

// =============================================================================
// 2026 CUTTING-EDGE COMPONENTS
// =============================================================================

export { GlassCard, type GlassCardProps, type GlassCardVariant } from './GlassCard';
export {
  MagneticButton,
  type MagneticButtonProps,
  type MagneticButtonVariant,
} from './MagneticButton';
export { ParticleField, type ParticleFieldProps } from './ParticleField';
export {
  KineticText,
  type KineticTextProps,
  type KineticTextAnimation,
  type KineticTextAs,
} from './KineticText';
export { ScrollProgress as ScrollProgressBar, type ScrollProgressProps } from './ScrollProgress';
export {
  BentoGrid as BentoGridNew,
  BentoItem,
  type BentoGridProps,
  type BentoItemProps,
  type BentoItemSize,
} from './BentoGrid';
export { FloatingLogo } from './FloatingLogo';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

export type { Variants, Transition } from 'framer-motion';
