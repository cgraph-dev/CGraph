/**
 * Export content shared types and constants.
 * @module screens/content/export-content/export-types
 */

// =============================================================================
// TYPES
// =============================================================================

export type ExportFormat = 'pdf' | 'html';
export type ExportType = 'thread' | 'post' | 'conversation';

export interface ExportOptions {
  includeReplies: boolean;
  includeImages: boolean;
  includeAvatars: boolean;
  includeTimestamps: boolean;
  includeUsernames: boolean;
  paperSize: 'a4' | 'letter';
}

export type RouteParams = {
  ExportContent: {
    type: ExportType;
    id: string;
    title: string;
  };
};

export interface ContentData {
  title: string;
  author: string;
  date: string;
  content: string;
  replies?: Array<{
    author: string;
    date: string;
    content: string;
  }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_OPTIONS: ExportOptions = {
  includeReplies: true,
  includeImages: true,
  includeAvatars: false,
  includeTimestamps: true,
  includeUsernames: true,
  paperSize: 'a4',
};
