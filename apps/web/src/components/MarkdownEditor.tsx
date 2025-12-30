import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import {
  BoldIcon,
  ItalicIcon,
  CodeBracketIcon,
  LinkIcon,
  PhotoIcon,
  ListBulletIcon,
  NumberedListIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';

// Custom icons for missing heroicons
const StrikethroughIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="12" x2="20" y2="12" />
    <path d="M6 16c.667 1.333 2 2 4 2 3 0 4-1.5 4-3 0-1.5-1-2.5-4-3m0-6c-.667-1.333-2-2-4-2-3 0-4 1.5-4 3" />
  </svg>
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  className?: string;
  disabled?: boolean;
}

interface ToolbarButton {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const toolbarButtons: ToolbarButton[] = [
  { icon: BoldIcon, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: ItalicIcon, label: 'Italic', prefix: '_', suffix: '_' },
  { icon: StrikethroughIcon as React.ComponentType<{ className?: string }>, label: 'Strikethrough', prefix: '~~', suffix: '~~' },
  { icon: CodeBracketIcon, label: 'Code', prefix: '`', suffix: '`' },
  { icon: LinkIcon, label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: PhotoIcon, label: 'Image', prefix: '![alt](', suffix: ')' },
  { icon: ListBulletIcon, label: 'Bullet List', prefix: '- ', suffix: '', block: true },
  { icon: NumberedListIcon, label: 'Numbered List', prefix: '1. ', suffix: '', block: true },
  { icon: ChatBubbleBottomCenterTextIcon, label: 'Quote', prefix: '> ', suffix: '', block: true },
];

/**
 * MarkdownEditor - A textarea with markdown formatting toolbar and live preview.
 * 
 * Features:
 * - Formatting toolbar (bold, italic, code, links, etc.)
 * - Live preview toggle
 * - Tab to indent
 * - Auto-resize
 */
export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here... (Markdown supported)',
  minRows = 6,
  maxRows = 20,
  className = '',
  disabled = false,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  const insertFormatting = (button: ToolbarButton) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText: string;
    let newCursorPos: number;

    if (button.block) {
      // For block elements, insert at the beginning of the line
      const beforeSelection = value.substring(0, start);
      const lastNewline = beforeSelection.lastIndexOf('\n');
      const lineStart = lastNewline + 1;
      
      newText = value.substring(0, lineStart) + button.prefix + value.substring(lineStart);
      newCursorPos = start + button.prefix.length;
    } else {
      // For inline elements, wrap selection
      newText = value.substring(0, start) + button.prefix + selectedText + button.suffix + value.substring(end);
      newCursorPos = selectedText ? end + button.prefix.length + button.suffix.length : start + button.prefix.length;
    }

    onChange(newText);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab to indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef) {
          textareaRef.selectionStart = textareaRef.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lineHeight = 24;
  const calculatedRows = Math.min(
    Math.max(minRows, (value.match(/\n/g) || []).length + 1),
    maxRows
  );

  return (
    <div className={`rounded-lg border border-dark-600 bg-dark-700 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-dark-600 bg-dark-800">
        <div className="flex items-center gap-0.5">
          {toolbarButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              onClick={() => insertFormatting(button)}
              disabled={disabled || showPreview}
              className="p-1.5 rounded hover:bg-dark-600 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={button.label}
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        
        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            showPreview
              ? 'bg-primary-600 text-white'
              : 'bg-dark-600 text-gray-400 hover:text-white'
          }`}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div 
          className="p-4 min-h-[150px] max-h-[500px] overflow-y-auto"
          style={{ minHeight: calculatedRows * lineHeight }}
        >
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-gray-500 italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <textarea
          ref={setTextareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={calculatedRows}
          className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none"
          style={{ lineHeight: `${lineHeight}px` }}
        />
      )}

      {/* Markdown help */}
      <div className="px-3 py-1.5 border-t border-dark-600 bg-dark-800">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Markdown supported:</span>{' '}
          **bold**, _italic_, `code`, [link](url), ![image](url)
        </p>
      </div>
    </div>
  );
}
