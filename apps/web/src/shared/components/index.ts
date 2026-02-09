/**
 * Shared Components - Single Export Point
 *
 * All reusable UI components organized by category.
 * Import from '@/shared/components' for module-based architecture.
 *
 * @module @shared/components
 */

// UI primitives (Button, Card, Dialog, etc.)
export * from './ui';

// Layout components (Sidebar, TopNav, PageContainer)
export * from './layout';

// Feedback components (Toast, Alert, Loading states)
export * from './feedback';

// Animated state components (Empty, Error)
export { AnimatedEmptyState, AnimatedErrorState } from './AnimatedEmptyState';

// Avatar lightbox (zoom-to-fullscreen)
export { AvatarLightbox } from './AvatarLightbox';
