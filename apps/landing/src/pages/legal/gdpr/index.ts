/**
 * GDPR Compliance Module
 *
 * Legal compliance page for GDPR data protection regulations.
 * Includes privacy sections, quick actions for data management,
 * and DPO contact information.
 *
 * @module pages/legal/gdpr
 * @since v0.9.2
 */

// Main component
export { default } from './GDPR';

// Sub-components
export { default as ContactSection } from './ContactSection';
export { default as QuickActions } from './QuickActions';

// Data
export { sections } from './sections';
export type { GDPRSection } from './sections';
