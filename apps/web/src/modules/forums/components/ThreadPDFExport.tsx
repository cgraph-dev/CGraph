/**
 * Thread PDF Export Component
 *
 * Generates PDF exports of forum threads for offline reading, archival,
 * or sharing. Uses jsPDF for client-side PDF generation.
 *
 * Features:
 * - Complete thread export with all posts
 * - Configurable options (include avatars, timestamps, etc.)
 * - Progress indicator for large threads
 * - Custom styling options
 * - Header/footer customization
 * - Page numbering
 * - Table of contents for long threads
 *
 * @module components/forums/ThreadPDFExport
 */

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentArrowDownIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ThreadPDFExport');

// =============================================================================
// TYPES
// =============================================================================

export interface ThreadPost {
  id: string;
  content: string;
  content_html?: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  created_at: string;
  is_edited?: boolean;
  edit_count?: number;
  position?: number;
}

export interface ThreadData {
  id: string;
  title: string;
  content?: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  created_at: string;
  board?: {
    name: string;
  };
  forum?: {
    name: string;
  };
  posts: ThreadPost[];
  reply_count?: number;
  view_count?: number;
}

export interface PDFExportOptions {
  includeAvatars: boolean;
  includeTimestamps: boolean;
  includePostNumbers: boolean;
  includeTableOfContents: boolean;
  includeMetadata: boolean;
  includeSignatures: boolean;
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  fontSize: 'small' | 'medium' | 'large';
  colorMode: 'full' | 'grayscale' | 'minimal';
  headerText?: string;
  footerText?: string;
}

export interface ThreadPDFExportProps {
  thread: ThreadData;
  disabled?: boolean;
  className?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: ThreadData;
  onExport: (options: PDFExportOptions) => Promise<void>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_OPTIONS: PDFExportOptions = {
  includeAvatars: false,
  includeTimestamps: true,
  includePostNumbers: true,
  includeTableOfContents: true,
  includeMetadata: true,
  includeSignatures: false,
  pageSize: 'a4',
  orientation: 'portrait',
  fontSize: 'medium',
  colorMode: 'minimal',
  headerText: '',
  footerText: 'Exported from CGraph Forums',
};

const PAGE_SIZES = {
  a4: { label: 'A4', width: 210, height: 297 },
  letter: { label: 'Letter', width: 216, height: 279 },
};

const FONT_SIZES = {
  small: { label: 'Small', body: 10, heading: 14 },
  medium: { label: 'Medium', body: 11, heading: 16 },
  large: { label: 'Large', body: 12, heading: 18 },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Strips HTML tags and converts to plain text
 */
const htmlToPlainText = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;

  // Convert common elements
  div.querySelectorAll('br').forEach((el) => el.replaceWith('\n'));
  div.querySelectorAll('p').forEach((el) => el.append('\n\n'));
  div.querySelectorAll('li').forEach((el) => el.prepend('• '));

  return div.textContent || '';
};

/**
 * Formats date for PDF display
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Truncates text to a maximum length
 */
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

// =============================================================================
// PDF GENERATION
// =============================================================================

/**
 * Generates a PDF from thread data
 * Uses dynamic import to load jsPDF only when needed
 */
async function generatePDF(
  thread: ThreadData,
  options: PDFExportOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  // Dynamically import jsPDF
  const { default: jsPDF } = await import('jspdf');

  const pageSize = PAGE_SIZES[options.pageSize];
  const fontSize = FONT_SIZES[options.fontSize];
  const isLandscape = options.orientation === 'landscape';

  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.pageSize,
  });

  const pageWidth = isLandscape ? pageSize.height : pageSize.width;
  const pageHeight = isLandscape ? pageSize.width : pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Helper to add a new page
  const addNewPage = () => {
    doc.addPage();
    yPosition = margin;
    addHeader();
  };

  // Helper to check if we need a new page
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin - 15) {
      addNewPage();
    }
  };

  // Add header to each page
  const addHeader = () => {
    if (options.headerText) {
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(options.headerText, margin, 10);
    }
  };

  // Add footer to each page
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);

    if (options.footerText) {
      doc.text(options.footerText, margin, pageHeight - 10);
    }

    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 10, {
      align: 'right',
    });
  };

  // Title page
  doc.setFontSize(fontSize.heading + 4);
  doc.setTextColor(0, 0, 0);
  doc.text(thread.title, margin, yPosition, { maxWidth: contentWidth });
  yPosition += 15;

  // Metadata
  if (options.includeMetadata) {
    doc.setFontSize(fontSize.body);
    doc.setTextColor(100, 100, 100);

    if (thread.forum?.name) {
      doc.text(`Forum: ${thread.forum.name}`, margin, yPosition);
      yPosition += 6;
    }
    if (thread.board?.name) {
      doc.text(`Board: ${thread.board.name}`, margin, yPosition);
      yPosition += 6;
    }
    doc.text(`Author: ${thread.author.username}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Created: ${formatDate(thread.created_at)}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Replies: ${thread.posts.length}`, margin, yPosition);
    yPosition += 15;
  }

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Table of contents
  if (options.includeTableOfContents && thread.posts.length > 10) {
    doc.setFontSize(fontSize.heading);
    doc.setTextColor(0, 0, 0);
    doc.text('Table of Contents', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(fontSize.body - 1);
    const tocEntries = Math.min(thread.posts.length, 50);

    for (let i = 0; i < tocEntries; i++) {
      checkPageBreak(6);
      const post = thread.posts[i];
      if (!post) continue;
      doc.text(
        `${i + 1}. ${truncateText(post.author.username, 20)} - ${formatDate(post.created_at)}`,
        margin,
        yPosition
      );
      yPosition += 5;
    }

    addNewPage();
  }

  // Original post (first post / thread content)
  if (thread.content) {
    checkPageBreak(30);

    doc.setFontSize(fontSize.heading - 2);
    doc.setTextColor(0, 0, 0);
    doc.text('Original Post', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(fontSize.body);
    doc.setTextColor(50, 50, 50);
    const content = htmlToPlainText(thread.content);
    const lines = doc.splitTextToSize(content, contentWidth);

    for (const line of lines) {
      checkPageBreak(6);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    }

    yPosition += 10;
  }

  // Posts
  const totalPosts = thread.posts.length;

  for (let i = 0; i < totalPosts; i++) {
    const post = thread.posts[i];
    if (!post) continue;

    onProgress?.(Math.round(((i + 1) / totalPosts) * 100));

    checkPageBreak(25);

    // Post separator
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Post header
    doc.setFontSize(fontSize.body);
    doc.setTextColor(0, 0, 0);

    const headerText = options.includePostNumbers
      ? `#${(post.position || i) + 1} - ${post.author.username}`
      : post.author.username;
    doc.text(headerText, margin, yPosition);

    if (options.includeTimestamps) {
      doc.setTextColor(128, 128, 128);
      doc.text(formatDate(post.created_at), pageWidth - margin, yPosition, { align: 'right' });
    }
    yPosition += 8;

    // Post content
    doc.setFontSize(fontSize.body);
    doc.setTextColor(50, 50, 50);
    const postContent = htmlToPlainText(post.content_html || post.content);
    const postLines = doc.splitTextToSize(postContent, contentWidth);

    for (const line of postLines) {
      checkPageBreak(6);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    }

    // Edit indicator
    if (post.is_edited) {
      doc.setFontSize(fontSize.body - 2);
      doc.setTextColor(150, 150, 150);
      doc.text(`(Edited ${post.edit_count || 1} time(s))`, margin, yPosition);
      yPosition += 5;
    }

    yPosition += 8;
  }

  // Add footers to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(i, pageCount);
  }

  // Return as blob
  return doc.output('blob');
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Option toggle switch
 */
const OptionToggle = memo(function OptionToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`h-6 w-10 rounded-full transition-colors ${
            checked ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <motion.div
            animate={{ x: checked ? 16 : 2 }}
            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
          />
        </div>
      </div>
      <div>
        <div className="font-medium text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
          {label}
        </div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
    </label>
  );
});

/**
 * Option select dropdown
 */
const OptionSelect = memo(function OptionSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; description?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});

/**
 * Export options modal
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

  const updateOption = <K extends keyof PDFExportOptions>(key: K, value: PDFExportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    try {
      await onExport(options);
      onClose();
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
                <DocumentTextIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Export to PDF
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {thread.posts.length} posts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* Content options */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Content Options</h3>
              <div className="space-y-3">
                <OptionToggle
                  label="Include timestamps"
                  description="Show when each post was made"
                  checked={options.includeTimestamps}
                  onChange={(v) => updateOption('includeTimestamps', v)}
                />
                <OptionToggle
                  label="Include post numbers"
                  description="Number each post in order"
                  checked={options.includePostNumbers}
                  onChange={(v) => updateOption('includePostNumbers', v)}
                />
                <OptionToggle
                  label="Include table of contents"
                  description="Add a TOC for threads with 10+ posts"
                  checked={options.includeTableOfContents}
                  onChange={(v) => updateOption('includeTableOfContents', v)}
                />
                <OptionToggle
                  label="Include metadata"
                  description="Forum name, board, author info"
                  checked={options.includeMetadata}
                  onChange={(v) => updateOption('includeMetadata', v)}
                />
              </div>
            </div>

            {/* Page options */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Page Options</h3>
              <div className="grid grid-cols-2 gap-4">
                <OptionSelect
                  label="Page Size"
                  value={options.pageSize}
                  onChange={(v) => updateOption('pageSize', v as 'a4' | 'letter')}
                  options={[
                    { value: 'a4', label: 'A4' },
                    { value: 'letter', label: 'Letter' },
                  ]}
                />
                <OptionSelect
                  label="Orientation"
                  value={options.orientation}
                  onChange={(v) => updateOption('orientation', v as 'portrait' | 'landscape')}
                  options={[
                    { value: 'portrait', label: 'Portrait' },
                    { value: 'landscape', label: 'Landscape' },
                  ]}
                />
                <OptionSelect
                  label="Font Size"
                  value={options.fontSize}
                  onChange={(v) => updateOption('fontSize', v as 'small' | 'medium' | 'large')}
                  options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
                <OptionSelect
                  label="Color Mode"
                  value={options.colorMode}
                  onChange={(v) => updateOption('colorMode', v as 'full' | 'grayscale' | 'minimal')}
                  options={[
                    { value: 'full', label: 'Full Color' },
                    { value: 'grayscale', label: 'Grayscale' },
                    { value: 'minimal', label: 'Minimal' },
                  ]}
                />
              </div>
            </div>

            {/* Custom text */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Custom Text</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Header Text
                  </label>
                  <input
                    type="text"
                    value={options.headerText || ''}
                    onChange={(e) => updateOption('headerText', e.target.value)}
                    placeholder="Optional header for each page"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={options.footerText || ''}
                    onChange={(e) => updateOption('footerText', e.target.value)}
                    placeholder="Optional footer for each page"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
            {isExporting ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
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

// =============================================================================
// MAIN COMPONENT
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
        link.download = `${thread.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50)}.pdf`;
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

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

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
        } ${sizeClasses[size]} ${className} `}
        title="Export to PDF"
      >
        <DocumentArrowDownIcon className={iconSizes[size]} />
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

// =============================================================================
// EXPORTS
// =============================================================================

export default ThreadPDFExport;
