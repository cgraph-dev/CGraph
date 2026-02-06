/**
 * App Layout Module
 *
 * Main application layout with responsive sidebar navigation,
 * notification badges, shader background, and toast container.
 *
 * @module layouts/app-layout
 */

// Main component
export { default } from './AppLayout';

// Sub-components
export { default as Sidebar } from './Sidebar';

// Hooks
export { useAppLayout } from './hooks';

// Constants
export { navItems } from './constants';
