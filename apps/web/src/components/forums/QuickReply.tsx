import React, { useState, useCallback } from 'react';
import { PaperAirplaneIcon, ChevronUpIcon, ChevronDownIcon, PhotoIcon, LinkIcon } from '@heroicons/react/24/outline';

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

interface QuickReplyProps {
  threadId: string;
  onSubmit: (content: string, attachments?: File[]) => Promise<void>;
  onExpandToFull?: () => void; // Navigate to full reply editor
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  quotedText?: string;
  className?: string;
}

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
      console.error('Failed to submit quick reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [content, attachments, onSubmit, isSubmitting]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+Enter to submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const insertBBCode = useCallback((tag: string, value?: string) => {
    const textarea = document.querySelector(`#quick-reply-${threadId}`) as HTMLTextAreaElement;
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
  }, [content, threadId]);

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
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white">Quick Reply</span>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Toolbar Toggle */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setShowToolbar(!showToolbar)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
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
            <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
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
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              <ToolbarButton title="Quote" onClick={() => insertBBCode('quote')}>
                <span className="text-sm">"</span>
              </ToolbarButton>
              <ToolbarButton title="Code" onClick={() => insertBBCode('code')}>
                <span className="font-mono text-xs">&lt;/&gt;</span>
              </ToolbarButton>
              <ToolbarButton title="Link" onClick={() => {
                const url = prompt('Enter URL:');
                if (url) insertBBCode('url', url);
              }}>
                <LinkIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton title="Image" onClick={() => {
                const url = prompt('Enter image URL:');
                if (url) insertBBCode('img');
              }}>
                <PhotoIcon className="w-4 h-4" />
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed
                       resize-y min-h-[100px]"
          />

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                >
                  <span className="truncate max-w-[100px]">{file.name}</span>
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
          <div className="flex items-center justify-between mt-3">
            {/* Left side - attachments */}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={disabled || isSubmitting}
                />
                <PhotoIcon className="w-5 h-5 text-gray-500" />
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
              >
                {isSubmitting ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <PaperAirplaneIcon className="w-4 h-4" />
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

// Toolbar Button Component
interface ToolbarButtonProps {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({ title, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
    >
      {children}
    </button>
  );
}

export default QuickReply;
