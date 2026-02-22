/**
 * App Layout Module
 *
 * Main application layout with responsive sidebar navigation,
 * notification badges, shader background, and toast container.
 *
 * @module layouts/app-layout
 */

// Main component
export { default } from './app-layout';

// Sub-components
export { default as Sidebar } from './sidebar';

// Hooks
export { useAppLayout } from './hooks';

// Constants
export { navItems } from './constants';
