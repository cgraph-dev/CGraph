/**
 * LandingDemo Type Definitions
 */

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface Stat {
  value: string;
  label: string;
  icon: string;
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
  external?: boolean;
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

export interface SwapButtonProps {
  primary?: boolean;
  mainText: string;
  altText: string;
  href?: string;
}

export interface TiltCardProps {
  icon: string;
  title: string;
  description: string;
}

export interface PreloaderProps {
  onComplete: () => void;
}

export interface SecurityIconCardProps {
  feature: SecurityFeature;
}
