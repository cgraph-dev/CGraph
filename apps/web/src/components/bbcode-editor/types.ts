/**
 * BBCode Editor Types
 *
 * Type definitions for the BBCode editor component.
 */

export interface BBCodeEditorProps {
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

export interface ToolbarButtonConfig {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  active?: boolean;
}

export type ToolbarItem = ToolbarButtonConfig | 'separator' | 'dropdown';

export interface ColorOption {
  name: string;
  value: string;
}

export interface FontSizeOption {
  name: string;
  value: string;
}

export interface SmileyOption {
  code: string;
  emoji: string;
}

export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export interface DropdownPickerProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export interface ColorPickerProps extends DropdownPickerProps {
  onSelectColor: (color: string) => void;
}

export interface SizePickerProps extends DropdownPickerProps {
  onSelectSize: (size: string) => void;
}

export interface SmiliesPickerProps extends DropdownPickerProps {
  onSelectSmiley: (emoji: string) => void;
}
