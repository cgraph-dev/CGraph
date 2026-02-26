/**
 * Quick reply input component for forum threads.
 * @module
 */
import React, { useState, useCallback } from 'react';
import {
  PaperAirplaneIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PhotoIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';
import type { QuickReplyProps } from './quick-reply-types';
import { ToolbarButton } from './toolbar-button';

const logger = createLogger('QuickReply');

/**
 * QuickReply Component
 *
 * MyBB-style quick reply box that appears at the bottom of threads.
 * Features:
 * - Collapsible/expandable
 * - Basic BBCode toolbar
 * - Character counter
 * - Attachment quick-add
 * - Quote selected text
 */

/**
 * unknown for the forums module.
 */
/**
 * Quick Reply component.
 */
export function QuickReply({
  threadId,
  onSubmit,
  onExpandToFull,
  placeholder = 'Write your reply...',
  maxLength = 10000,
  disabled = false,
  quotedText,
  className = '',
}: QuickReplyProps) {
  const [content, setContent] = useState(quotedText ? `[quote]${quotedText}[/quote]\n\n` : '');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showToolbar, setShowToolbar] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, attachments.length > 0 ? attachments : undefined);
      setContent('');
      setAttachments([]);
    } catch (error) {
      logger.error('Failed to submit quick reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [content, attachments, onSubmit, isSubmitting]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+Enter to submit
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const insertBBCode = useCallback(
    (tag: string, value?: string) => {
       
      const textarea = document.querySelector(`#quick-reply-${threadId}`) as HTMLTextAreaElement; // safe downcast – DOM element
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);

      let insertion: string;
      if (value) {
        insertion = `[${tag}=${value}]${selectedText}[/${tag}]`;
      } else {
        insertion = `[${tag}]${selectedText}[/${tag}]`;
      }

      const newContent = content.substring(0, start) + insertion + content.substring(end);
      setContent(newContent);

      // Focus back and set cursor
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + insertion.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [content, threadId]
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const remainingChars = maxLength - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
      >
        <span className="font-medium text-gray-900 dark:text-white">Quick Reply</span>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Toolbar Toggle */}
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowToolbar(!showToolbar)}
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {showToolbar ? 'Hide formatting' : 'Show formatting'}
            </button>
            {onExpandToFull && (
              <button
                type="button"
                onClick={onExpandToFull}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Full Editor
              </button>
            )}
          </div>

          {/* BBCode Toolbar */}
          {showToolbar && (
            <div className="mb-2 flex flex-wrap gap-1 rounded bg-gray-50 p-2 dark:bg-gray-700/50">
              <ToolbarButton title="Bold" onClick={() => insertBBCode('b')}>
                <span className="font-bold">B</span>
              </ToolbarButton>
              <ToolbarButton title="Italic" onClick={() => insertBBCode('i')}>
                <span className="italic">I</span>
              </ToolbarButton>
              <ToolbarButton title="Underline" onClick={() => insertBBCode('u')}>
                <span className="underline">U</span>
              </ToolbarButton>
              <ToolbarButton title="Strikethrough" onClick={() => insertBBCode('s')}>
                <span className="line-through">S</span>
              </ToolbarButton>
              <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <ToolbarButton title="Quote" onClick={() => insertBBCode('quote')}>
                <span className="text-sm">"</span>
              </ToolbarButton>
              <ToolbarButton title="Code" onClick={() => insertBBCode('code')}>
                <span className="font-mono text-xs">&lt;/&gt;</span>
              </ToolbarButton>
              <ToolbarButton
                title="Link"
                onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) insertBBCode('url', url);
                }}
              >
                <LinkIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                title="Image"
                onClick={() => {
                  const url = prompt('Enter image URL:');
                  if (url) insertBBCode('img');
                }}
              >
                <PhotoIcon className="h-4 w-4" />
              </ToolbarButton>
            </div>
          )}

          {/* Textarea */}
          <textarea
            id={`quick-reply-${threadId}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            rows={4}
            className="min-h-[100px] w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
          />

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-700"
                >
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            {/* Left side - attachments */}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer rounded p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={disabled || isSubmitting}
                />
                <PhotoIcon className="h-5 w-5 text-gray-500" />
              </label>
              <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {remainingChars.toLocaleString()} characters remaining
              </span>
            </div>

            {/* Right side - submit */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Ctrl+Enter to send</span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={disabled || isSubmitting || !content.trim() || isOverLimit}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <PaperAirplaneIcon className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Posting...' : 'Post Reply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickReply;
