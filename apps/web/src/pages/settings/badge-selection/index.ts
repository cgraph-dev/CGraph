/**
 * Badge Selection Module
 */

// Main component
export { default } from './BadgeSelection';

// Sub-components
export { BadgeCard } from './BadgeCard';
export { BadgeFilters } from './BadgeFilters';
export { BadgeGrid } from './BadgeGrid';
export { BadgePreviewModal } from './BadgePreviewModal';
export { EquippedBadgesPanel } from './EquippedBadgesPanel';

// Constants
export * from './constants';

// Types
export type {
  Badge,
  BadgeCardProps,
  BadgeFiltersProps,
  BadgeGridProps,
  BadgePreviewModalProps,
  EquippedBadgesPanelProps,
} from './types';
