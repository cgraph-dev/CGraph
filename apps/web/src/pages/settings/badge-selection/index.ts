/**
 * Badge Selection Module
 */

// Main component
export { default } from './badge-selection';

// Sub-components
export { BadgeCard } from './badge-card';
export { BadgeFilters } from './badge-filters';
export { BadgeGrid } from './badge-grid';
export { BadgePreviewModal } from './badge-preview-modal';
export { EquippedBadgesPanel } from './equipped-badges-panel';

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
