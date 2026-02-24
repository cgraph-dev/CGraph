/**
 * Export Modal Component
 *
 * Modal dialog for configuring PDF export options.
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentArrowDownIcon, XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

import type { ExportModalProps, PDFExportOptions } from './types';
import { DEFAULT_OPTIONS, PAGE_SIZES, FONT_SIZES } from './constants';
import { OptionToggle } from './option-toggle';
import { OptionSelect } from './option-select';
import { springs } from '@/lib/animation-presets';

// =============================================================================
// ANIMATIONS
// =============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Modal for configuring and triggering PDF export
 */
export const ExportModal = memo(function ExportModal({
  isOpen,
  onClose,
  thread,
  onExport,
}: ExportModalProps) {
  const [options, setOptions] = useState<PDFExportOptions>(DEFAULT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Update a single option
  const updateOption = useCallback(
    <K extends keyof PDFExportOptions>(key: K, value: PDFExportOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Handle export action
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      await onExport(options);
      onClose();
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [options, onExport, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={springs.default}
          className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <DocumentArrowDownIcon className="h-6 w-6 text-orange-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Export to PDF
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure your export options
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
            {/* Thread Preview */}
            <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{thread.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {thread.posts.length} replies • By {thread.author.name}
              </p>
            </div>

            {/* Content Options */}
            <div className="mb-6 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Cog6ToothIcon className="h-4 w-4" />
                Content Options
              </h3>

              <div className="space-y-3">
                <OptionToggle
                  label="Include metadata"
                  description="Author, date, view count"
                  checked={options.includeMetadata}
                  onChange={(v) => updateOption('includeMetadata', v)}
                />

                <OptionToggle
                  label="Include replies"
                  description={`${thread.posts.length} replies will be included`}
                  checked={options.includeReplies}
                  onChange={(v) => updateOption('includeReplies', v)}
                />

                <OptionToggle
                  label="Include timestamps"
                  checked={options.includeTimestamps}
                  onChange={(v) => updateOption('includeTimestamps', v)}
                />

                <OptionToggle
                  label="Include like counts"
                  checked={options.includeLikes}
                  onChange={(v) => updateOption('includeLikes', v)}
                />
              </div>
            </div>

            {/* Page Options */}
            <div className="mb-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Page Options</h3>

              <div className="space-y-3">
                <OptionSelect
                  label="Page size"
                  value={options.pageSize}
                  onChange={(v) => updateOption('pageSize', v)}
                  options={PAGE_SIZES}
                />

                <OptionSelect
                  label="Font size"
                  value={options.fontSize}
                  onChange={(v) => updateOption('fontSize', v)}
                  options={FONT_SIZES}
                />
              </div>
            </div>

            {/* Custom Text */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Custom Text (Optional)
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                    Header text
                  </label>
                  <input
                    type="text"
                    value={options.headerText || ''}
                    onChange={(e) => updateOption('headerText', e.target.value)}
                    placeholder="e.g., Confidential"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                    Footer text
                  </label>
                  <input
                    type="text"
                    value={options.footerText || ''}
                    onChange={(e) => updateOption('footerText', e.target.value)}
                    placeholder="e.g., Page number will be added"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            {isExporting ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Generating PDF...</span>
                  <span className="text-orange-600 dark:text-orange-400">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    className="h-full bg-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default ExportModal;
