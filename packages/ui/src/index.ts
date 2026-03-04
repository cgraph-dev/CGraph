/**
 * @cgraph/ui — Liquid Glass Component Library
 *
 * Barrel export for all shared Liquid Glass components.
 * Phase 1: Button, Card, Modal.
 */

// Shared utilities & constants
export {
  cn,
  springPreset,
  springSnap,
  springGentle,
  glassSurface,
  glassSurfaceElevated,
  glowColors,
  prefersReducedMotion,
  type GlowColor,
} from './shared';

// Components
export { LiquidButton, buttonVariants, type LiquidButtonProps } from './components/liquid-button';
export { LiquidCard, cardVariants, type LiquidCardProps } from './components/liquid-card';
export { LiquidModal, type LiquidModalProps } from './components/liquid-modal';
