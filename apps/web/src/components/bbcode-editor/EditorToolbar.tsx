/**
 * Editor Toolbar
 *
 * Formatting toolbar with BBCode buttons and pickers.
 */

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
  ExclamationTriangleIcon,
  PlayIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { ColorPicker } from './ColorPicker';
import { SizePicker } from './SizePicker';
import { SmiliesPicker } from './SmiliesPicker';
import type { ToolbarItem } from './types';

interface EditorToolbarProps {
  insertTag: (openTag: string, closeTag?: string, defaultText?: string) => void;
  insertAtCursor: (text: string) => void;
  promptLink: () => void;
  promptImage: () => void;
  promptYouTube: () => void;
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  showSizePicker: boolean;
  setShowSizePicker: (show: boolean) => void;
  showSmilies: boolean;
  setShowSmilies: (show: boolean) => void;
  showPreview: boolean;
  isPreviewMode: boolean;
  setIsPreviewMode: (mode: boolean) => void;
}

export function EditorToolbar({
  insertTag,
  insertAtCursor,
  promptLink,
  promptImage,
  promptYouTube,
  showColorPicker,
  setShowColorPicker,
  showSizePicker,
  setShowSizePicker,
  showSmilies,
  setShowSmilies,
  showPreview,
  isPreviewMode,
  setIsPreviewMode,
}: EditorToolbarProps) {
  const toolbarButtons: ToolbarItem[] = [
    {
      icon: <BoldIcon className="h-4 w-4" />,
      label: 'Bold',
      action: () => insertTag('[b]', '[/b]'),
    },
    {
      icon: <ItalicIcon className="h-4 w-4" />,
      label: 'Italic',
      action: () => insertTag('[i]', '[/i]'),
    },
    {
      icon: <UnderlineIcon className="h-4 w-4" />,
      label: 'Underline',
      action: () => insertTag('[u]', '[/u]'),
    },
    {
      icon: <StrikethroughIcon className="h-4 w-4" />,
      label: 'Strikethrough',
      action: () => insertTag('[s]', '[/s]'),
    },
    'separator',
    {
      icon: <LinkIcon className="h-4 w-4" />,
      label: 'Insert Link',
      action: promptLink,
    },
    {
      icon: <PhotoIcon className="h-4 w-4" />,
      label: 'Insert Image',
      action: promptImage,
    },
    {
      icon: <PlayIcon className="h-4 w-4" />,
      label: 'Insert YouTube',
      action: promptYouTube,
    },
    'separator',
    {
      icon: <CodeBracketIcon className="h-4 w-4" />,
      label: 'Code Block',
      action: () => insertTag('[code]', '[/code]'),
    },
    {
      icon: <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />,
      label: 'Quote',
      action: () => insertTag('[quote]', '[/quote]'),
    },
    {
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      label: 'Spoiler',
      action: () => insertTag('[spoiler]', '[/spoiler]'),
    },
    'separator',
    {
      icon: <ListBulletIcon className="h-4 w-4" />,
      label: 'Bullet List',
      action: () => insertTag('[list]\n[*]', '\n[/list]', 'Item 1\n[*]Item 2\n[*]Item 3'),
    },
    {
      icon: <NumberedListIcon className="h-4 w-4" />,
      label: 'Numbered List',
      action: () => insertTag('[list=1]\n[*]', '\n[/list]', 'Item 1\n[*]Item 2\n[*]Item 3'),
    },
    'separator',
    {
      icon: <Bars3BottomLeftIcon className="h-4 w-4" />,
      label: 'Align Left',
      action: () => insertTag('[align=left]', '[/align]'),
    },
    {
      icon: <Bars3Icon className="h-4 w-4" />,
      label: 'Align Center',
      action: () => insertTag('[align=center]', '[/align]'),
    },
    {
      icon: <Bars3BottomRightIcon className="h-4 w-4" />,
      label: 'Align Right',
      action: () => insertTag('[align=right]', '[/align]'),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-dark-500 bg-dark-700/50 p-2">
      {toolbarButtons.map((item, index) => {
        if (item === 'separator') {
          return <div key={index} className="mx-1 h-6 w-px bg-dark-500" />;
        }
        if (item === 'dropdown') {
          return null;
        }
        return (
          <button
            key={index}
            type="button"
            onClick={item.action}
            className="rounded p-2 text-gray-400 transition-colors hover:bg-dark-600 hover:text-gray-200"
            title={item.label}
          >
            {item.icon}
          </button>
        );
      })}

      <ColorPicker
        isOpen={showColorPicker}
        onToggle={() => {
          setShowColorPicker(!showColorPicker);
          setShowSizePicker(false);
          setShowSmilies(false);
        }}
        onClose={() => setShowColorPicker(false)}
        onSelectColor={(color) => insertTag(`[color=${color}]`, '[/color]')}
      />

      <SizePicker
        isOpen={showSizePicker}
        onToggle={() => {
          setShowSizePicker(!showSizePicker);
          setShowColorPicker(false);
          setShowSmilies(false);
        }}
        onClose={() => setShowSizePicker(false)}
        onSelectSize={(size) => insertTag(`[size=${size}]`, '[/size]')}
      />

      <SmiliesPicker
        isOpen={showSmilies}
        onToggle={() => {
          setShowSmilies(!showSmilies);
          setShowColorPicker(false);
          setShowSizePicker(false);
        }}
        onClose={() => setShowSmilies(false)}
        onSelectSmiley={(emoji) => insertAtCursor(emoji)}
      />

      {showPreview && (
        <>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={cn(
              'flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors',
              isPreviewMode
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:bg-dark-600 hover:text-gray-200'
            )}
          >
            {isPreviewMode ? (
              <>
                <EyeSlashIcon className="h-4 w-4" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4" />
                <span>Preview</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
