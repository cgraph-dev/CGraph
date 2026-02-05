/**
 * LandingDemo Module - Barrel Export
 *
 * Modularized from 1,372 lines to organized structure.
 */

// Main component
export { default } from './LandingDemo';

// Sub-components
export { Preloader } from './Preloader';
export { SecurityIconCard } from './SecurityIconCard';
export { TiltCard } from './TiltCard';
export { SignInButton, SwapButton } from './Buttons';
export { HeroSection } from './HeroSection';
export { StatsSection } from './StatsSection';
export { FeaturesSection } from './FeaturesSection';
export { CustomizationShowcase, ForumShowcaseSection } from './ShowcaseSections';
export { SecuritySection } from './SecuritySection';
export { PricingSection } from './PricingSection';
export { CTASection } from './CTASection';
export { FooterSection } from './FooterSection';

// Hooks
export { useLandingAnimations } from './useLandingAnimations';

// Utilities
export { throttle } from './utils';

// Types
export type * from './types';

// Constants
export { features, stats, pricingTiers, footerLinks, securityFeatures } from './constants';
