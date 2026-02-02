import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon,
  EyeIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  PaperClipIcon,
  XMarkIcon,
  SparklesIcon,
  HashtagIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline';

// Reserved for future features
const _reservedPostEditor = { DocumentTextIcon, HashtagIcon, AtSymbolIcon };
void _reservedPostEditor;

import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import type { ThreadPrefix, ForumCategory } from '@/stores/forumStore';

/**
 * PostEditor Component
 *
 * Rich text editor for creating forum posts with:
 * - Markdown/BBCode support
 * - Live preview
 * - File attachments with drag & drop
 * - Thread prefix selection
 * - Category selection
 * - Poll creation
 * - Emoji picker
 * - @mention autocomplete
 * - Autosave drafts
 * - Character count
 */

interface PollOptionInput {
  id: string;
  text: string;
}

interface PostEditorProps {
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

// Custom icon components for missing heroicons
function UnderlineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 21h12M7 4v8a5 5 0 0010 0V4" />
    </svg>
  );
}

function StrikethroughIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12h16M12 4c-2.5 0-4 1.5-4 3s1.5 2.5 4 2.5m0 5c2.5 0 4-1.5 4-3"
      />
    </svg>
  );
}

function QuoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  );
}

function HeadingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8" />
    </svg>
  );
}

export function PostEditor({
  initialTitle = '',
  initialContent = '',
  initialCategory,
  initialPrefix,
  prefixes = [],
  categories = [],
  maxTitleLength = 300,
  maxContentLength = 40000,
  allowPoll = true,
  allowAttachments = true,
  allowNsfw = true,
  onSubmit,
  onCancel,
  onSaveDraft,
  submitLabel = 'Post',
  isEditing: _isEditing = false,
  className = '',
}: PostEditorProps) {
  void _isEditing;
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

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

  // Autosave draft every 30 seconds
  useEffect(() => {
    if (!onSaveDraft) return;

    const interval = setInterval(() => {
      if (title || content) {
        onSaveDraft(buildPostData());
        setLastSaved(new Date());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [title, content, categoryId, prefixId, isNsfw]);

  const buildPostData = useCallback((): PostEditorData => {
    const pollData =
      showPollCreator && pollQuestion && pollOptions.filter((o) => o.text.trim()).length >= 2
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

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    HapticFeedback.success();

    try {
      await onSubmit(buildPostData());
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertFormatting = (tag: string, _value?: string) => {
    void _value;
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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
      HapticFeedback.success();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, { id: Date.now().toString(), text: '' }]);
    }
  };

  const removePollOption = (id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((o) => o.id !== id));
    }
  };

  const updatePollOption = (id: string, text: string) => {
    setPollOptions(pollOptions.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const renderPreview = () => (
    <div className="prose prose-invert min-h-[200px] max-w-none rounded-lg border border-dark-600 bg-dark-800 p-4">
      <h1>{title || 'Post Title'}</h1>
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content || '<p>Your content will appear here...</p>', {
            USE_PROFILES: { html: true },
          }),
        }}
      />
    </div>
  );

  const toolbarButtons = [
    { tag: 'bold', icon: BoldIcon, label: 'Bold' },
    { tag: 'italic', icon: ItalicIcon, label: 'Italic' },
    { tag: 'underline', icon: UnderlineIcon, label: 'Underline' },
    { tag: 'strikethrough', icon: StrikethroughIcon, label: 'Strikethrough' },
    { tag: 'divider' },
    { tag: 'heading', icon: HeadingIcon, label: 'Heading' },
    { tag: 'quote', icon: QuoteIcon, label: 'Quote' },
    { tag: 'code', icon: CodeBracketIcon, label: 'Code' },
    { tag: 'list', icon: ListBulletIcon, label: 'List' },
    { tag: 'divider' },
    { tag: 'link', icon: LinkIcon, label: 'Link' },
    { tag: 'image', icon: PhotoIcon, label: 'Image' },
  ];

  return (
    <div className={className}>
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Title Input */}
        <div className="border-b border-dark-700 p-4">
          <div className="mb-3 flex gap-3">
            {/* Prefix Selector */}
            {prefixes.length > 0 && (
              <div className="relative">
                <select
                  value={prefixId || ''}
                  onChange={(e) => setPrefixId(e.target.value || undefined)}
                  className="appearance-none rounded-lg bg-dark-700 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                >
                  <option value="">No Prefix</option>
                  {prefixes.map((prefix) => (
                    <option key={prefix.id} value={prefix.id}>
                      {prefix.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            )}

            {/* Category Selector */}
            {categories.length > 0 && (
              <div className="relative">
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value || undefined)}
                  className="appearance-none rounded-lg bg-dark-700 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            )}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, maxTitleLength))}
            placeholder="Post title..."
            className="w-full bg-transparent text-xl font-semibold placeholder-gray-500 outline-none"
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {title.length}/{maxTitleLength}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-dark-700 bg-dark-800/50 p-2">
          {toolbarButtons.map((button, index) =>
            button.tag === 'divider' ? (
              <div key={index} className="mx-1 h-6 w-px bg-dark-600" />
            ) : (
              <motion.button
                key={button.tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => insertFormatting(button.tag)}
                className="rounded p-2 text-gray-400 transition-colors hover:bg-dark-600 hover:text-white"
                title={button.label}
              >
                {button.icon && <button.icon className="h-4 w-4" />}
              </motion.button>
            )
          )}

          <div className="flex-1" />

          {/* View Toggle */}
          <div className="flex items-center rounded-lg bg-dark-700 p-0.5">
            <button
              onClick={() => setIsPreview(false)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
                !isPreview ? 'bg-dark-600 text-white' : 'text-gray-400'
              }`}
            >
              <PencilSquareIcon className="h-4 w-4" />
              Write
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
                isPreview ? 'bg-dark-600 text-white' : 'text-gray-400'
              }`}
            >
              <EyeIcon className="h-4 w-4" />
              Preview
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          className={`relative ${isDragging ? 'ring-2' : ''}`}
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <AnimatePresence mode="wait">
            {isPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderPreview()}
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, maxContentLength))}
                  placeholder="Write your post content here... (Markdown supported)"
                  className="min-h-[300px] w-full resize-y bg-transparent p-4 placeholder-gray-500 outline-none"
                  style={{ fontFamily: 'inherit' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drag Overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-dark-800/90"
              >
                <div className="text-center">
                  <PaperClipIcon
                    className="mx-auto mb-2 h-12 w-12"
                    style={{ color: primaryColor }}
                  />
                  <p className="text-lg font-medium">Drop files to attach</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Character Count */}
        <div className="border-t border-dark-700 px-4 py-2 text-right text-xs text-gray-500">
          {content.length.toLocaleString()}/{maxContentLength.toLocaleString()} characters
          {lastSaved && (
            <span className="ml-4">Auto-saved at {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="border-t border-dark-700 p-4">
            <div className="mb-2 text-sm font-medium">Attachments ({attachments.length})</div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg bg-dark-700 px-3 py-1.5 text-sm"
                >
                  <PaperClipIcon className="h-4 w-4 text-gray-400" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poll Creator */}
        <AnimatePresence>
          {showPollCreator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-dark-700 bg-dark-800/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-medium">
                    <SparklesIcon className="h-5 w-5" style={{ color: primaryColor }} />
                    Poll
                  </h3>
                  <button
                    onClick={() => setShowPollCreator(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="mb-3 w-full rounded-lg bg-dark-700 p-3 outline-none focus:ring-2"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                />

                <div className="mb-3 space-y-2">
                  {pollOptions.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="w-6 text-gray-500">{index + 1}.</span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updatePollOption(option.id, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 rounded-lg bg-dark-700 p-2 outline-none focus:ring-2"
                        style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => removePollOption(option.id)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 10 && (
                  <button
                    onClick={addPollOption}
                    className="mb-3 text-sm hover:underline"
                    style={{ color: primaryColor }}
                  >
                    + Add option
                  </button>
                )}

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pollAllowMultiple}
                      onChange={(e) => setPollAllowMultiple(e.target.checked)}
                      className="rounded"
                    />
                    Allow multiple choices
                  </label>

                  <select
                    value={pollDuration || ''}
                    onChange={(e) =>
                      setPollDuration(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="rounded bg-dark-700 px-2 py-1 text-sm"
                  >
                    <option value="">No end date</option>
                    <option value="24">1 day</option>
                    <option value="72">3 days</option>
                    <option value="168">1 week</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-dark-700 bg-dark-800/50 p-4">
          {allowAttachments && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-dark-600 p-2 text-gray-400 hover:text-white"
                title="Attach files"
              >
                <PaperClipIcon className="h-5 w-5" />
              </motion.button>
            </>
          )}

          {allowPoll && !showPollCreator && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPollCreator(true)}
              className="rounded-lg bg-dark-600 p-2 text-gray-400 hover:text-white"
              title="Add poll"
            >
              <SparklesIcon className="h-5 w-5" />
            </motion.button>
          )}

          {allowNsfw && (
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={isNsfw}
                onChange={(e) => setIsNsfw(e.target.checked)}
                className="rounded"
              />
              NSFW
            </label>
          )}

          <div className="flex-1" />

          {onCancel && (
            <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
              Cancel
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
            className="rounded-lg px-6 py-2 font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? 'Posting...' : submitLabel}
          </motion.button>
        </div>
      </GlassCard>
    </div>
  );
}

export default PostEditor;
