// Forum Components
// Complete set of components for forum functionality

// Core Display Components
export { default as ThreadView, ThreadView as ThreadViewComponent } from './ThreadView';
export { default as NestedComments } from './NestedComments';
export { default as ThreadPrefix } from './ThreadPrefix';
export { default as ThreadRating } from './ThreadRating';
export { default as ThreadedCommentTree } from './ThreadedCommentTree';

// Search & Navigation
export {
  default as ForumSearch,
  ForumSearch as ForumSearchComponent,
  type SearchFilters,
} from './ForumSearch';
export {
  default as ForumCategoryList,
  ForumCategoryList as ForumCategoryListComponent,
} from './ForumCategoryList';
export { default as ForumHeader, ForumHeader as ForumHeaderComponent } from './ForumHeader';

// Content Creation
export {
  default as PostEditor,
  PostEditor as PostEditorComponent,
  type PostEditorData,
} from './PostEditor';
export { QuickReply } from './QuickReply';
export { default as PollWidget } from './PollWidget';
export { default as AttachmentUploader } from './AttachmentUploader';
export {
  default as PostIconPicker,
  PostIconPicker as PostIconPickerComponent,
  PostIconDisplay,
  usePostIcons,
  type PostIcon,
  type PostIconPickerProps,
} from './PostIconPicker';

// User Content
export { default as UserSignature } from './UserSignature';
export { default as EditHistoryModal } from './EditHistoryModal';
export { default as ReportModal } from './ReportModal';
export { default as MultiQuoteIndicator } from './MultiQuoteIndicator';

// Stats & Widgets
export { default as ForumStatistics } from './ForumStatistics';
export { default as LeaderboardWidget } from './LeaderboardWidget';

// RSS/Syndication
export {
  default as RSSFeedButton,
  RSSFeedButton as RSSFeedButtonComponent,
  RSSFeedLink,
  FeedSubscribeModal,
  type RSSFeedButtonProps,
  type FeedType,
  type FeedFormat,
} from './RSSFeedButton';

// Export/Download
export {
  default as ThreadPDFExport,
  ThreadPDFExport as ThreadPDFExportComponent,
  ExportModal as PDFExportModal,
  type ThreadData as PDFThreadData,
  type ThreadPost as PDFThreadPost,
  type PDFExportOptions,
  type ThreadPDFExportProps,
} from './ThreadPDFExport';
