/**
 * Forum components module exports.
 * @module
 */
// Forum Components
// Complete set of components for forum functionality

// Core Display Components
export { default as ThreadView, ThreadView as ThreadViewComponent } from './thread-view';
export { default as NestedComments } from './nested-comments';
export { default as ThreadPrefix } from './thread-prefix';
export { default as ThreadRating } from './thread-rating';
export { default as ThreadedCommentTree } from './threaded-comment-tree';

// Search & Navigation
export {
  default as ForumSearch,
  ForumSearch as ForumSearchComponent,
  type SearchFilters,
} from './forum-search';
export {
  default as ForumCategoryList,
  ForumCategoryList as ForumCategoryListComponent,
} from './forum-category-list';
export { default as ForumHeader, ForumHeader as ForumHeaderComponent } from './forum-header';

// Content Creation
export {
  default as PostEditor,
  PostEditor as PostEditorComponent,
  type PostEditorData,
} from './post-editor';
export { QuickReply } from './quick-reply';
export { default as PollWidget } from './poll-widget';
export { default as AttachmentUploader } from './attachment-uploader';
export {
  default as PostIconPicker,
  PostIconPicker as PostIconPickerComponent,
  PostIconDisplay,
  usePostIcons,
  type PostIcon,
  type PostIconPickerProps,
} from './post-icon-picker';

// User Content
export { default as UserSignature } from './user-signature';
export { default as EditHistoryModal } from './edit-history-modal';
export { default as ReportModal } from './report-modal';
export { default as MultiQuoteIndicator } from './multi-quote-indicator';

// Stats & Widgets
export { default as ForumStatistics } from './forum-statistics';
export { default as LeaderboardWidget } from './leaderboard-widget';

// RSS/Syndication
export {
  default as RSSFeedButton,
  RSSFeedButton as RSSFeedButtonComponent,
  RSSFeedLink,
  FeedSubscribeModal,
  type RSSFeedButtonProps,
  type FeedType,
  type FeedFormat,
} from './rss-feed-button';

// Export/Download
export {
  default as ThreadPDFExport,
  ThreadPDFExport as ThreadPDFExportComponent,
  ExportModal as PDFExportModal,
  type ThreadData as PDFThreadData,
  type ThreadPost as PDFThreadPost,
  type PDFExportOptions,
  type ThreadPDFExportProps,
} from './thread-pdf-export';
