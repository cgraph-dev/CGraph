/** @module Type definitions for the QuickReply component. */

export interface QuickReplyProps {
  threadId: string;
  onSubmit: (content: string, attachments?: File[]) => Promise<void>;
  onExpandToFull?: () => void; // Navigate to full reply editor
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  quotedText?: string;
  className?: string;
}

export interface ToolbarButtonProps {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}
