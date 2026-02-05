/**
 * Showcase Components - Type Definitions
 */

import type { ReactNode, RefObject } from 'react';

// =============================================================================
// CARD STACK
// =============================================================================

export interface Card3DProps {
  children: ReactNode;
  index: number;
  total: number;
  isActive: boolean;
  onClick: () => void;
}

export interface CardStackProps {
  cards: ReactNode[];
  className?: string;
}

// =============================================================================
// FLOATING CARD
// =============================================================================

export interface FloatingCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  floatRange?: number;
  rotateRange?: number;
}

// =============================================================================
// SCROLL TIMELINE
// =============================================================================

export interface TimelineItemProps {
  title: string;
  description: string;
  icon: string;
  index: number;
}

export interface ScrollTimelineProps {
  items: Array<{ title: string; description: string; icon: string }>;
  className?: string;
}

// =============================================================================
// HORIZONTAL SCROLL
// =============================================================================

export interface HorizontalScrollProps {
  children: ReactNode[];
  className?: string;
}

// =============================================================================
// SCROLL PROGRESS
// =============================================================================

export interface ScrollProgressProps {
  className?: string;
  color?: string;
}

// =============================================================================
// REVEAL CONTAINER
// =============================================================================

export type RevealDirection = 'up' | 'down' | 'left' | 'right';

export interface RevealContainerProps {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
  delay?: number;
}

// =============================================================================
// SCROLL COUNTER
// =============================================================================

export interface ScrollCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

// =============================================================================
// PARALLAX IMAGE
// =============================================================================

export interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
}

// =============================================================================
// SPLIT TEXT
// =============================================================================

export type SplitTextType = 'words' | 'chars';

export interface SplitTextProps {
  children: string;
  className?: string;
  type?: SplitTextType;
  stagger?: number;
}

// =============================================================================
// MAGNETIC GRID
// =============================================================================

export interface MagneticGridProps {
  children: ReactNode[];
  columns?: number;
  className?: string;
}

export interface MagneticGridItemProps {
  children: ReactNode;
  mousePos: { x: number; y: number };
  containerRef: RefObject<HTMLDivElement | null>;
}

// =============================================================================
// PERSPECTIVE TILT
// =============================================================================

export interface PerspectiveTiltProps {
  children: ReactNode;
  className?: string;
  perspective?: number;
  maxTilt?: number;
}

// =============================================================================
// ANIMATED TABS
// =============================================================================

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface AnimatedTabsProps {
  tabs: TabItem[];
  className?: string;
}

// =============================================================================
// BENTO GRID
// =============================================================================

export type BentoSpan = 'normal' | 'wide' | 'tall';

export interface BentoItem {
  title: string;
  description: string;
  icon: string;
  color: string;
  span?: BentoSpan;
}

export interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

// =============================================================================
// TESTIMONIAL CAROUSEL
// =============================================================================

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

export interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}
