/**
 * Thread PDF Export Constants
 *
 * Configuration defaults and option sets for PDF generation.
 */

import type { PDFExportOptions } from './types';

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

/**
 * Default PDF export options
 */
export const DEFAULT_OPTIONS: PDFExportOptions = {
  includeMetadata: true,
  includeReplies: true,
  includeAvatars: false,
  includeTimestamps: true,
  includeLikes: false,
  pageSize: 'letter',
  fontSize: 'medium',
  headerText: '',
  footerText: '',
};

// =============================================================================
// PAGE SIZE OPTIONS
// =============================================================================

/**
 * Available page sizes for PDF export
 */
export const PAGE_SIZES = [
  { value: 'letter' as const, label: 'US Letter (8.5" × 11")' },
  { value: 'a4' as const, label: 'A4 (210mm × 297mm)' },
  { value: 'legal' as const, label: 'US Legal (8.5" × 14")' },
];

// =============================================================================
// FONT SIZE OPTIONS
// =============================================================================

/**
 * Available font sizes for PDF export
 */
export const FONT_SIZES = [
  { value: 'small' as const, label: 'Small (10pt)' },
  { value: 'medium' as const, label: 'Medium (12pt)' },
  { value: 'large' as const, label: 'Large (14pt)' },
];

// =============================================================================
// PDF GENERATION CONSTANTS
// =============================================================================

/**
 * Font size mappings for PDF generation (in points)
 */
export const FONT_SIZE_MAP = {
  small: 10,
  medium: 12,
  large: 14,
} as const;

/**
 * Page dimensions for different page sizes
 */
export const PAGE_DIMENSIONS = {
  letter: { width: 612, height: 792 }, // 8.5 × 11 inches at 72 DPI
  a4: { width: 595, height: 842 }, // 210 × 297 mm at 72 DPI
  legal: { width: 612, height: 1008 }, // 8.5 × 14 inches at 72 DPI
} as const;

/**
 * PDF margin settings
 */
export const PDF_MARGINS = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
} as const;

/**
 * Line height multiplier for text
 */
export const LINE_HEIGHT = 1.5;
