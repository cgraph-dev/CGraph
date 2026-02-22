/**
 * Thread PDF Export Component
 *
 * Main export button that triggers the PDF export modal.
 */

import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

import { useToast } from '@/shared/hooks';
import { createLogger } from '@/lib/logger';

import type { ThreadPDFExportProps, PDFExportOptions } from './types';
import { generatePDF } from './pdf-generator';
import { sanitizeFilename } from './utils';
import { ExportModal } from './export-modal';

const logger = createLogger('ThreadPDFExport');

// =============================================================================
// CONSTANTS
// =============================================================================

const SIZE_CLASSES = {
  sm: 'p-1.5 text-xs',
  md: 'p-2 text-sm',
  lg: 'p-3 text-base',
} as const;

const ICON_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Thread PDF Export Button
 *
 * Provides a button to export a forum thread to PDF format.
 *
 * @example
 * ```tsx
 * <ThreadPDFExport
 *   thread={threadData}
 *   variant="button"
 * />
 * ```
 */
export const ThreadPDFExport = memo(function ThreadPDFExport({
  thread,
  disabled = false,
  className = '',
  variant = 'button',
  size = 'md',
}: ThreadPDFExportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const handleExport = useCallback(
    async (options: PDFExportOptions) => {
      setIsExporting(true);
      try {
        const blob = await generatePDF(thread, options, (_progress) => {
          // Progress updates handled by modal - _progress available for future UI enhancement
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sanitizeFilename(thread.title)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast?.({ type: 'success', message: 'PDF exported successfully!' });
      } catch (error) {
        logger.error('PDF export error:', error);
        showToast?.({ type: 'error', message: 'Failed to export PDF. Please try again.' });
      } finally {
        setIsExporting(false);
      }
    },
    [thread, showToast]
  );

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || isExporting}
        className={`inline-flex items-center gap-2 rounded-lg transition-colors ${
          disabled || isExporting
            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        } ${SIZE_CLASSES[size]} ${className}`}
        title="Export to PDF"
      >
        <DocumentArrowDownIcon className={ICON_SIZES[size]} />
        {variant === 'button' && <span className="font-medium">Export PDF</span>}
      </motion.button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        thread={thread}
        onExport={handleExport}
      />
    </>
  );
});

export default ThreadPDFExport;
