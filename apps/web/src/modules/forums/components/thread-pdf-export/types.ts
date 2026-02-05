/**
 * Thread PDF Export Types
 *
 * Type definitions for PDF export functionality.
 */

// =============================================================================
// THREAD DATA TYPES
// =============================================================================

/**
 * Represents a post within a thread
 */
export interface ThreadPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date | string;
  likes?: number;
  isOp?: boolean;
}

/**
 * Represents thread data for PDF export
 */
export interface ThreadData {
  id: string;
  title: string;
  categoryName?: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: Date | string;
  content: string;
  posts: ThreadPost[];
  viewCount?: number;
  replyCount?: number;
}

// =============================================================================
// EXPORT OPTIONS
// =============================================================================

/**
 * PDF export configuration options
 */
export interface PDFExportOptions {
  /** Include thread metadata (author, date, stats) */
  includeMetadata: boolean;
  /** Include reply posts */
  includeReplies: boolean;
  /** Include author avatars (if available) */
  includeAvatars: boolean;
  /** Include post timestamps */
  includeTimestamps: boolean;
  /** Include like counts */
  includeLikes: boolean;
  /** Page size (letter, a4, legal) */
  pageSize: 'letter' | 'a4' | 'legal';
  /** Font size for content */
  fontSize: 'small' | 'medium' | 'large';
  /** Header text for each page */
  headerText?: string;
  /** Footer text for each page */
  footerText?: string;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for the ThreadPDFExport component
 */
export interface ThreadPDFExportProps {
  /** Thread data to export */
  thread: ThreadData;
  /** Whether the export button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: 'button' | 'icon';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for the ExportModal component
 */
export interface ExportModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Thread data to export */
  thread: ThreadData;
  /** Callback when export is triggered */
  onExport: (options: PDFExportOptions) => Promise<void>;
}

/**
 * Props for the OptionToggle component
 */
export interface OptionToggleProps {
  /** Label for the toggle */
  label: string;
  /** Description text */
  description?: string;
  /** Current checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
}

/**
 * Props for the OptionSelect component
 */
export interface OptionSelectProps<T extends string> {
  /** Label for the select */
  label: string;
  /** Current value */
  value: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Available options */
  options: { value: T; label: string }[];
}
