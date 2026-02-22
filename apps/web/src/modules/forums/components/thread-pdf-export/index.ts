/**
 * Thread PDF Export Module
 *
 * Exports forum threads to PDF format with customizable options.
 *
 * @module thread-pdf-export
 */

// Main component
export { ThreadPDFExport, default } from './thread-pdf-export';

// Sub-components
export { ExportModal } from './export-modal';
export { OptionToggle } from './option-toggle';
export { OptionSelect } from './option-select';

// Core functionality
export { generatePDF } from './pdf-generator';

// Utilities
export { htmlToPlainText, formatDate, truncateText, sanitizeFilename } from './utils';

// Constants
export {
  DEFAULT_OPTIONS,
  PAGE_SIZES,
  FONT_SIZES,
  FONT_SIZE_MAP,
  PAGE_DIMENSIONS,
  PDF_MARGINS,
} from './constants';

// Types
export type {
  ThreadPost,
  ThreadData,
  PDFExportOptions,
  ThreadPDFExportProps,
  ExportModalProps,
  OptionToggleProps,
  OptionSelectProps,
} from './types';
