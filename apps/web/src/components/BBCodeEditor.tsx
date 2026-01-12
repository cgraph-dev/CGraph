import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon, 
  StrikethroughIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon,
  ListBulletIcon,
  NumberedListIcon,
  ChatBubbleBottomCenterTextIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  SwatchIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import BBCodeRenderer from './BBCodeRenderer';
import { validateBBCode, countBBCodeCharacters } from '@/lib/bbcode';
import { cn } from '@/lib/utils';

interface BBCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum character count */
  maxLength?: number;
  /** Show live preview */
  showPreview?: boolean;
  /** Show character count */
  showCharCount?: boolean;
  /** Disable toolbar */
  disableToolbar?: boolean;
  /** Custom ID for the textarea */
  id?: string;
  /** Autofocus */
  autoFocus?: boolean;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  active?: boolean;
}

// Color palette for color picker
const COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'White', value: '#FFFFFF' },
];

// Font sizes
const FONT_SIZES = [
  { name: 'Small', value: '12' },
  { name: 'Normal', value: '16' },
  { name: 'Large', value: '20' },
  { name: 'X-Large', value: '24' },
  { name: 'Huge', value: '32' },
];

// Common smilies/emoticons
const SMILIES = [
  { code: ':)', emoji: '😊' },
  { code: ':D', emoji: '😃' },
  { code: ';)', emoji: '😉' },
  { code: ':P', emoji: '😛' },
  { code: ':(', emoji: '😢' },
  { code: ':o', emoji: '😮' },
  { code: '<3', emoji: '❤️' },
  { code: ':thumbsup:', emoji: '👍' },
  { code: ':fire:', emoji: '🔥' },
  { code: ':100:', emoji: '💯' },
];

/**
 * BBCode Editor with Toolbar
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
  useEffect(() => {
    const handleClickOutside = () => {
      setShowColorPicker(false);
      setShowSizePicker(false);
      setShowSmilies(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get current selection
  const getSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0, text: '' };
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value.substring(start, end);
    
    return { start, end, text };
  }, [value]);

  // Insert BBCode tag
  const insertTag = useCallback((openTag: string, closeTag: string = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end, text } = getSelection();
    const selectedText = text || defaultText;
    
    const newValue = 
      value.substring(0, start) + 
      openTag + selectedText + closeTag + 
      value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after update
    setTimeout(() => {
      textarea.focus();
      // Position cursor to select the inserted text for easy replacement
      textarea.setSelectionRange(
        start + openTag.length,
        start + openTag.length + selectedText.length
      );
    }, 0);
  }, [value, onChange, getSelection]);

  // Insert at cursor
  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { start, end } = getSelection();
    const newValue = value.substring(0, start) + text + value.substring(end);
    
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [value, onChange, getSelection]);

  // Prompt for URL/text
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

  // Toolbar buttons
  const toolbarButtons: (ToolbarButton | 'separator' | 'dropdown')[] = [
    {
      icon: <BoldIcon className="w-4 h-4" />,
      label: 'Bold',
      action: () => insertTag('[b]', '[/b]'),
    },
    {
      icon: <ItalicIcon className="w-4 h-4" />,
      label: 'Italic',
      action: () => insertTag('[i]', '[/i]'),
    },
    {
      icon: <UnderlineIcon className="w-4 h-4" />,
      label: 'Underline',
      action: () => insertTag('[u]', '[/u]'),
    },
    {
      icon: <StrikethroughIcon className="w-4 h-4" />,
      label: 'Strikethrough',
      action: () => insertTag('[s]', '[/s]'),
    },
    'separator',
    {
      icon: <LinkIcon className="w-4 h-4" />,
      label: 'Insert Link',
      action: promptLink,
    },
    {
      icon: <PhotoIcon className="w-4 h-4" />,
      label: 'Insert Image',
      action: promptImage,
    },
    {
      icon: <PlayIcon className="w-4 h-4" />,
      label: 'Insert YouTube',
      action: promptYouTube,
    },
    'separator',
    {
      icon: <CodeBracketIcon className="w-4 h-4" />,
      label: 'Code Block',
      action: () => insertTag('[code]', '[/code]'),
    },
    {
      icon: <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />,
      label: 'Quote',
      action: () => insertTag('[quote]', '[/quote]'),
    },
    {
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      label: 'Spoiler',
      action: () => insertTag('[spoiler]', '[/spoiler]'),
    },
    'separator',
    {
      icon: <ListBulletIcon className="w-4 h-4" />,
      label: 'Bullet List',
      action: () => insertTag('[list]\n[*]', '\n[/list]', 'Item 1\n[*]Item 2\n[*]Item 3'),
    },
    {
      icon: <NumberedListIcon className="w-4 h-4" />,
      label: 'Numbered List',
      action: () => insertTag('[list=1]\n[*]', '\n[/list]', 'Item 1\n[*]Item 2\n[*]Item 3'),
    },
    'separator',
    {
      icon: <Bars3BottomLeftIcon className="w-4 h-4" />,
      label: 'Align Left',
      action: () => insertTag('[align=left]', '[/align]'),
    },
    {
      icon: <Bars3Icon className="w-4 h-4" />,
      label: 'Align Center',
      action: () => insertTag('[align=center]', '[/align]'),
    },
    {
      icon: <Bars3BottomRightIcon className="w-4 h-4" />,
      label: 'Align Right',
      action: () => insertTag('[align=right]', '[/align]'),
    },
  ];

  return (
    <div className={cn('bbcode-editor border border-dark-500 rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      {!disableToolbar && (
        <div className="flex items-center gap-1 p-2 bg-dark-700/50 border-b border-dark-500 flex-wrap">
          {toolbarButtons.map((item, index) => {
            if (item === 'separator') {
              return <div key={index} className="w-px h-6 bg-dark-500 mx-1" />;
            }
            if (item === 'dropdown') {
              return null;
            }
            return (
              <button
                key={index}
                type="button"
                onClick={item.action}
                className="p-2 rounded hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
                title={item.label}
              >
                {item.icon}
              </button>
            );
          })}

          {/* Color Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
                setShowSizePicker(false);
                setShowSmilies(false);
              }}
              className="p-2 rounded hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
              title="Text Color"
            >
              <SwatchIcon className="w-4 h-4" />
            </button>
            {showColorPicker && (
              <div 
                className="absolute top-full left-0 mt-1 p-2 bg-dark-700 border border-dark-500 rounded-lg shadow-xl z-50 grid grid-cols-5 gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => {
                      insertTag(`[color=${color.value}]`, '[/color]');
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-dark-400 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Font Size Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSizePicker(!showSizePicker);
                setShowColorPicker(false);
                setShowSmilies(false);
              }}
              className="p-2 rounded hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
              title="Font Size"
            >
              <DocumentTextIcon className="w-4 h-4" />
            </button>
            {showSizePicker && (
              <div 
                className="absolute top-full left-0 mt-1 p-1 bg-dark-700 border border-dark-500 rounded-lg shadow-xl z-50 min-w-[100px]"
                onClick={(e) => e.stopPropagation()}
              >
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => {
                      insertTag(`[size=${size.value}]`, '[/size]');
                      setShowSizePicker(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-dark-600 rounded"
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Smilies Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSmilies(!showSmilies);
                setShowColorPicker(false);
                setShowSizePicker(false);
              }}
              className="p-2 rounded hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
              title="Insert Emoji"
            >
              <FaceSmileIcon className="w-4 h-4" />
            </button>
            {showSmilies && (
              <div 
                className="absolute top-full left-0 mt-1 p-2 bg-dark-700 border border-dark-500 rounded-lg shadow-xl z-50 grid grid-cols-5 gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {SMILIES.map((smiley) => (
                  <button
                    key={smiley.code}
                    type="button"
                    onClick={() => {
                      insertAtCursor(smiley.emoji);
                      setShowSmilies(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-dark-600 rounded"
                    title={smiley.code}
                  >
                    {smiley.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview Toggle */}
          {showPreview && (
            <>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors',
                  isPreviewMode
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-600'
                )}
              >
                {isPreviewMode ? (
                  <>
                    <EyeSlashIcon className="w-4 h-4" />
                    <span>Edit</span>
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-4 h-4" />
                    <span>Preview</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Editor / Preview */}
      {isPreviewMode ? (
        <div 
          className="p-4 bg-dark-800"
          style={{ minHeight }}
        >
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
          className="w-full p-4 bg-dark-800 text-gray-200 placeholder-gray-500 resize-y focus:outline-none"
          style={{ minHeight }}
        />
      )}

      {/* Footer with char count and validation */}
      {(showCharCount || !validation.valid) && (
        <div className="flex items-center justify-between px-4 py-2 bg-dark-700/50 border-t border-dark-500 text-xs">
          {/* Validation errors */}
          {!validation.valid && (
            <div className="flex items-center gap-2 text-yellow-400">
              <ExclamationTriangleIcon className="w-3 h-3" />
              <span>{validation.errors[0]}</span>
            </div>
          )}
          
          {/* Character count */}
          {showCharCount && (
            <div className={cn(
              'ml-auto',
              maxLength && charCount > maxLength ? 'text-red-400' : 'text-gray-500'
            )}>
              {charCount}
              {maxLength && ` / ${maxLength}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { BBCodeEditor };
