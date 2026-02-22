import { useState, useRef, useCallback } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useAdaptiveInterval } from '@/hooks/useAdaptiveInterval';
import { AUTOSAVE_INTERVAL, MIN_POLL_OPTIONS } from './constants';
import type { PostEditorData, PostEditorProps, PollOptionInput } from './types';

/**
 * Custom hook for PostEditor state management
 *
 * Handles all state, autosave, and business logic for the post editor
 */
export function usePostEditor({
  initialTitle = '',
  initialContent = '',
  initialCategory,
  initialPrefix,
  maxTitleLength = 300,
  maxContentLength = 40000,
  onSubmit,
  onSaveDraft,
}: Pick<
  PostEditorProps,
  | 'initialTitle'
  | 'initialContent'
  | 'initialCategory'
  | 'initialPrefix'
  | 'maxTitleLength'
  | 'maxContentLength'
  | 'onSubmit'
  | 'onSaveDraft'
>) {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [prefixId, setPrefixId] = useState(initialPrefix);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isNsfw, setIsNsfw] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOptionInput[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollDuration, setPollDuration] = useState<number | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const buildPostData = useCallback((): PostEditorData => {
    const pollData =
      showPollCreator &&
      pollQuestion &&
      pollOptions.filter((o) => o.text.trim()).length >= MIN_POLL_OPTIONS
        ? {
            question: pollQuestion,
            options: pollOptions.filter((o) => o.text.trim()).map((o) => o.text),
            allowMultiple: pollAllowMultiple,
            duration: pollDuration,
          }
        : undefined;

    return {
      title,
      content,
      categoryId,
      prefixId,
      attachments,
      poll: pollData,
      isNsfw,
    };
  }, [
    title,
    content,
    categoryId,
    prefixId,
    attachments,
    showPollCreator,
    pollQuestion,
    pollOptions,
    pollAllowMultiple,
    pollDuration,
    isNsfw,
  ]);

  // Autosave draft: AUTOSAVE_INTERVAL when active, skipped when tab hidden
  const saveDraftCallback = useCallback(() => {
    if ((title || content) && onSaveDraft) {
      onSaveDraft(buildPostData());
      setLastSaved(new Date());
    }
  }, [title, content, onSaveDraft, buildPostData]);

  useAdaptiveInterval(saveDraftCallback, AUTOSAVE_INTERVAL, {
    enabled: !!onSaveDraft,
  });

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    HapticFeedback.success();

    try {
      await onSubmit(buildPostData());
    } finally {
      setIsSubmitting(false);
    }
  }, [title, content, isSubmitting, onSubmit, buildPostData]);

  const insertFormatting = useCallback(
    (tag: string) => {
      if (!contentRef.current) return;

      const textarea = contentRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);

      let insertion: string;
      let cursorOffset: number;

      switch (tag) {
        case 'bold':
          insertion = `**${selectedText || 'bold text'}**`;
          cursorOffset = selectedText ? insertion.length : 2;
          break;
        case 'italic':
          insertion = `*${selectedText || 'italic text'}*`;
          cursorOffset = selectedText ? insertion.length : 1;
          break;
        case 'underline':
          insertion = `__${selectedText || 'underlined text'}__`;
          cursorOffset = selectedText ? insertion.length : 2;
          break;
        case 'strikethrough':
          insertion = `~~${selectedText || 'strikethrough text'}~~`;
          cursorOffset = selectedText ? insertion.length : 2;
          break;
        case 'code':
          insertion = selectedText.includes('\n')
            ? `\`\`\`\n${selectedText || 'code'}\n\`\`\``
            : `\`${selectedText || 'code'}\``;
          cursorOffset = selectedText ? insertion.length : 1;
          break;
        case 'link':
          insertion = `[${selectedText || 'link text'}](url)`;
          cursorOffset = selectedText ? insertion.length - 4 : 1;
          break;
        case 'image':
          insertion = `![${selectedText || 'alt text'}](image-url)`;
          cursorOffset = selectedText ? insertion.length - 11 : 2;
          break;
        case 'quote':
          insertion = `> ${selectedText || 'quote'}`;
          cursorOffset = insertion.length;
          break;
        case 'list':
          insertion = `\n- ${selectedText || 'item'}`;
          cursorOffset = insertion.length;
          break;
        case 'heading':
          insertion = `## ${selectedText || 'Heading'}`;
          cursorOffset = insertion.length;
          break;
        default:
          return;
      }

      const newContent = content.substring(0, start) + insertion + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.focus();
        const newPos = start + cursorOffset;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);

      HapticFeedback.light();
    },
    [content]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
      HapticFeedback.success();
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addPollOption = useCallback(() => {
    setPollOptions((prev) => {
      if (prev.length < 10) {
        return [...prev, { id: Date.now().toString(), text: '' }];
      }
      return prev;
    });
  }, []);

  const removePollOption = useCallback((id: string) => {
    setPollOptions((prev) => {
      if (prev.length > MIN_POLL_OPTIONS) {
        return prev.filter((o) => o.id !== id);
      }
      return prev;
    });
  }, []);

  const updatePollOption = useCallback((id: string, text: string) => {
    setPollOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  }, []);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value.slice(0, maxTitleLength));
    },
    [maxTitleLength]
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value.slice(0, maxContentLength));
    },
    [maxContentLength]
  );

  return {
    // Refs
    contentRef,
    fileInputRef,

    // State
    title,
    content,
    categoryId,
    prefixId,
    attachments,
    isNsfw,
    isPreview,
    isSubmitting,
    showPollCreator,
    pollQuestion,
    pollOptions,
    pollAllowMultiple,
    pollDuration,
    isDragging,
    lastSaved,

    // Setters
    setTitle: handleTitleChange,
    setContent: handleContentChange,
    setCategoryId,
    setPrefixId,
    setIsNsfw,
    setIsPreview,
    setShowPollCreator,
    setPollQuestion,
    setPollAllowMultiple,
    setPollDuration,

    // Actions
    handleSubmit,
    insertFormatting,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileSelect,
    removeAttachment,
    addPollOption,
    removePollOption,
    updatePollOption,

    // Computed
    canSubmit: Boolean(title.trim() && content.trim()),
  };
}
