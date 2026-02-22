/**
 * Logo Module
 *
 * CGraph circuit board logo system with multiple variants:
 * LogoIcon (primary), LogoWithText, LogoSimple, LogoSquare, and LogoLoader.
 *
 * @module components/logo
 */

// Main component
export { LogoIcon } from './logo-icon';

// Variant components
export { LogoWithText, LogoSimple, LogoSquare, LogoLoader } from './logo-variants';

// Types
export type { LogoProps, LogoColorVariant } from './types';

// Constants
export { colorPalettes } from './colors';
export type { LogoColorPalette } from './colors';

// Default export for backward compatibility
export { LogoIcon as default } from './logo-icon';
