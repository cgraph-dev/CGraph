import type { ThreadPrefix, ForumCategory } from '@/modules/forums/store';

/**
 * Poll option input for creating polls
 */
export interface PollOptionInput {
  id: string;
  text: string;
}

/**
 * Data structure for submitting a post
 */
export interface PostEditorData {
  title: string;
  content: string;
  categoryId?: string;
  prefixId?: string;
  attachments: File[];
  poll?: {
    question: string;
    options: string[];
    allowMultiple: boolean;
    duration?: number; // hours
  };
  isNsfw: boolean;
}

/**
 * Props for the PostEditor component
 */
export interface PostEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialCategory?: string;
  initialPrefix?: string;
  prefixes?: ThreadPrefix[];
  categories?: ForumCategory[];
  maxTitleLength?: number;
  maxContentLength?: number;
  allowPoll?: boolean;
  allowAttachments?: boolean;
  allowNsfw?: boolean;
  onSubmit: (data: PostEditorData) => Promise<void>;
  onCancel?: () => void;
  onSaveDraft?: (data: PostEditorData) => void;
  submitLabel?: string;
  isEditing?: boolean;
  className?: string;
}

/**
 * Toolbar button definition
 */
export interface ToolbarButton {
  tag: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label?: string;
}

/**
 * Props for PollCreator component
 */
export interface PollCreatorProps {
  pollQuestion: string;
  setPollQuestion: (question: string) => void;
  pollOptions: PollOptionInput[];
  addPollOption: () => void;
  removePollOption: (id: string) => void;
  updatePollOption: (id: string, text: string) => void;
  pollAllowMultiple: boolean;
  setPollAllowMultiple: (allow: boolean) => void;
  pollDuration: number | undefined;
  setPollDuration: (duration: number | undefined) => void;
  onClose: () => void;
  primaryColor: string;
}

/**
 * Props for EditorToolbar component
 */
export interface EditorToolbarProps {
  isPreview: boolean;
  setIsPreview: (preview: boolean) => void;
  onInsertFormatting: (tag: string) => void;
}

/**
 * Props for AttachmentsList component
 */
export interface AttachmentsListProps {
  attachments: File[];
  onRemove: (index: number) => void;
}

/**
 * Props for EditorActions component
 */
export interface EditorActionsProps {
  allowAttachments: boolean;
  allowPoll: boolean;
  allowNsfw: boolean;
  showPollCreator: boolean;
  isNsfw: boolean;
  setIsNsfw: (nsfw: boolean) => void;
  setShowPollCreator: (show: boolean) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  onFileSelect: () => void;
  submitLabel: string;
  primaryColor: string;
}
