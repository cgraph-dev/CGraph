/**
 * LandingDemoWorkshop - Type Definitions
 */

import type { CSSProperties } from 'react';

// =============================================================================
// FEATURE & DATA TYPES
// =============================================================================

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinks {
  product: FooterLink[];
  resources: FooterLink[];
  company: FooterLink[];
  legal: FooterLink[];
}

export interface SecurityFeature {
  icon: string;
  title: string;
  description: string;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface PreloaderProps {
  onComplete: () => void;
}

export interface SecurityIconCardProps {
  feature: SecurityFeature;
}

export interface TiltCardProps {
  icon: string;
  title: string;
  description: string;
}

export interface SwapButtonProps {
  primary?: boolean;
  mainText: string;
  altText: string;
  href?: string;
}

// =============================================================================
// CSS VARIABLE STYLES
// =============================================================================

export interface StarCSSProperties extends CSSProperties {
  '--x': string;
  '--y': string;
  '--delay': string;
  '--duration': string;
  '--size': string;
}

export interface EnergyCSSProperties extends CSSProperties {
  '--i': number;
  '--x': string;
  '--speed': string;
}

export interface ParticleCSSProperties extends CSSProperties {
  '--i': number;
}

export interface LetterCSSProperties extends CSSProperties {
  '--letter-index': number;
}
