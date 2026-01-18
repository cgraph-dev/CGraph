/**
 * External Components
 *
 * This is where you import components from external libraries like:
 * - 21st.dev
 * - reactbits.dev
 * - Magic UI
 * - Aceternity UI
 *
 * Usage:
 *   import { SpotlightCard, GlowButton } from '@/components/external';
 *
 * To add a new component:
 * 1. Create the file in this folder
 * 2. Export it here
 */

// Example exports (uncomment when you add components):
// export { SpotlightCard } from './SpotlightCard';
// export { GlowButton } from './GlowButton';
// export { AnimatedGradient } from './AnimatedGradient';

// Re-export compatible components from our landing library
// These follow the same patterns as 21st.dev / reactbits.dev
export {
  // Cards
  TiltCard,
  HolographicCard,
  FloatingCard,

  // Buttons
  Magnetic,

  // Backgrounds
  ParticleNetwork,
  GradientBackground,
  GridBackground,
  AuroraBackground,
  ShaderBackground,
  Constellation,

  // Text Effects
  GlowText,
  GlitchText,
  TextScramble,
  SplitText,
  ChromaticText,

  // Animations
  springs,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  staggerContainer,

  // Layout
  BentoGrid,
  InfiniteMarquee,
} from '@/components/landing';
