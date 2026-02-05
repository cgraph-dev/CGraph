/**
 * LandingDemoWorkshop Module
 * Barrel export for modular landing demo workshop components
 */

// Main component
export { default } from './LandingDemoWorkshop';

// Types
export type * from './types';

// Constants
export * from './constants';

// Components
export { Preloader } from './Preloader';
export { SecurityIconCard } from './SecurityIconCard';
export { TiltCard } from './TiltCard';
export { SwapButton } from './SwapButton';
export { Navigation } from './Navigation';
export { HeroSection } from './HeroSection';
export { FeaturesSection } from './FeaturesSection';
export { StatsSection } from './StatsSection';
export { SecuritySection } from './SecuritySection';
export { ForumShowcaseSection, CustomizationShowcaseSection } from './ShowcaseSections';
export { PricingSection } from './PricingSection';
export { CTASection } from './CTASection';
export { FooterSection } from './FooterSection';

// Hooks
export { useNavScroll } from './useNavScroll';
export { useWorkshopAnimations } from './useWorkshopAnimations';
export { useAboutGlow } from './useAboutGlow';
