/**
 * BBCode Editor Module
 *
 * Barrel exports for the modular BBCode editor.
 */

// Main component
export { default, BBCodeEditor } from './BBCodeEditor';

// Sub-components
export { EditorToolbar } from './EditorToolbar';
export { EditorFooter } from './EditorFooter';
export { ColorPicker } from './ColorPicker';
export { SizePicker } from './SizePicker';
export { SmiliesPicker } from './SmiliesPicker';

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
