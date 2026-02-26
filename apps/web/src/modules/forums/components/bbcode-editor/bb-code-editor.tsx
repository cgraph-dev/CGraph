/**
 * BBCode Editor
 *
 * Full-featured BBCode editor with:
 * - Formatting toolbar (bold, italic, underline, etc.)
 * - Color picker
 * - Font size selector
 * - Link and image insertion
 * - Live preview toggle
 * - Character count
 * - Validation warnings
 */

import { useState, useRef, useCallback } from 'react';
import BBCodeRenderer from '@/components/content/bb-code-renderer';
import { validateBBCode, countBBCodeCharacters } from '@/lib/bbcode';
import { cn } from '@/lib/utils';
import { useTextSelection, useBBCodeInsertion, useDropdownClose } from './hooks';
import { EditorToolbar } from './editor-toolbar';
import { EditorFooter } from './editor-footer';
import type { BBCodeEditorProps } from './types';

/**
 * B B Code Editor component.
 */
export default function BBCodeEditor({
  value,
  onChange,
  placeholder = 'Write your message...',
  className = '',
  minHeight = 150,
  maxLength,
  showPreview = true,
  showCharCount = true,
  disableToolbar = false,
  id,
  autoFocus = false,
}: BBCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showSmilies, setShowSmilies] = useState(false);

  // Close dropdowns when clicking outside
  useDropdownClose(setShowColorPicker, setShowSizePicker, setShowSmilies);

  // Text selection and insertion hooks
  const { getSelection } = useTextSelection(textareaRef, value);
  const { insertTag, insertAtCursor } = useBBCodeInsertion(
    textareaRef,
    value,
    onChange,
    getSelection
  );

  // Prompt handlers
  const promptLink = useCallback(() => {
    const { text } = getSelection();
    const url = prompt('Enter URL:', 'https://');
    if (!url) return;

    const linkText = text || prompt('Enter link text:', 'Click here') || 'Click here';
    insertTag(`[url=${url}]`, '[/url]', linkText);
  }, [getSelection, insertTag]);

  const promptImage = useCallback(() => {
    const url = prompt('Enter image URL:', 'https://');
    if (!url) return;
    insertTag('[img]', '[/img]', url);
  }, [insertTag]);

  const promptYouTube = useCallback(() => {
    const url = prompt('Enter YouTube URL:', 'https://www.youtube.com/watch?v=');
    if (!url) return;
    insertTag('[youtube]', '[/youtube]', url);
  }, [insertTag]);

  // Validation
  const validation = validateBBCode(value);
  const charCount = countBBCodeCharacters(value);

  return (
    <div
      className={cn('bbcode-editor overflow-hidden rounded-lg border border-dark-500', className)}
    >
      {/* Toolbar */}
      {!disableToolbar && (
        <EditorToolbar
          insertTag={insertTag}
          insertAtCursor={insertAtCursor}
          promptLink={promptLink}
          promptImage={promptImage}
          promptYouTube={promptYouTube}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          showSizePicker={showSizePicker}
          setShowSizePicker={setShowSizePicker}
          showSmilies={showSmilies}
          setShowSmilies={setShowSmilies}
          showPreview={showPreview}
          isPreviewMode={isPreviewMode}
          setIsPreviewMode={setIsPreviewMode}
        />
      )}

      {/* Editor / Preview */}
      {isPreviewMode ? (
        <div className="bg-dark-800 p-4" style={{ minHeight }}>
          <BBCodeRenderer content={value} showWarnings />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full resize-y bg-dark-800 p-4 text-gray-200 placeholder-gray-500 focus:outline-none"
          style={{ minHeight }}
        />
      )}

      {/* Footer with char count and validation */}
      <EditorFooter
        showCharCount={showCharCount}
        charCount={charCount}
        maxLength={maxLength}
        validation={validation}
      />
    </div>
  );
}

export { BBCodeEditor };
