/**
 * BBCode Editor Module
 *
 * Barrel exports for the modular BBCode editor.
 */

// Main component
export { default, BBCodeEditor } from './bb-code-editor';

// Sub-components
export { EditorToolbar } from './editor-toolbar';
export { EditorFooter } from './editor-footer';
export { ColorPicker } from './color-picker';
export { SizePicker } from './size-picker';
export { SmiliesPicker } from './smilies-picker';

// Hooks
export { useTextSelection, useBBCodeInsertion, useDropdownClose } from './hooks';

// Types
export type {
  BBCodeEditorProps,
  ToolbarButtonConfig,
  ToolbarItem,
  ColorOption,
  FontSizeOption,
  SmileyOption,
  TextSelection,
  DropdownPickerProps,
  ColorPickerProps,
  SizePickerProps,
  SmiliesPickerProps,
} from './types';

// Constants
export { COLORS, FONT_SIZES, SMILIES } from './constants';
