/**
 * BBCode Editor Hooks
 *
 * Custom hooks for text selection and BBCode tag insertion.
 */

import { useCallback, useEffect, RefObject } from 'react';
import type { TextSelection } from './types';

/**
 * Hook for managing text selection in textarea
 */
export function useTextSelection(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string
) {
  const getSelection = useCallback((): TextSelection => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0, text: '' };

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value.substring(start, end);

    return { start, end, text };
  }, [textareaRef, value]);

  return { getSelection };
}

/**
 * Hook for inserting BBCode tags
 */
export function useBBCodeInsertion(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
  onChange: (value: string) => void,
  getSelection: () => TextSelection
) {
  const insertTag = useCallback(
    (openTag: string, closeTag: string = '', defaultText = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { start, end, text } = getSelection();
      const selectedText = text || defaultText;

      const newValue =
        value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end);

      onChange(newValue);

      // Set cursor position after update
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + openTag.length,
          start + openTag.length + selectedText.length
        );
      }, 0);
    },
    [textareaRef, value, onChange, getSelection]
  );

  const insertAtCursor = useCallback(
    (text: string) => {
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
    },
    [textareaRef, value, onChange, getSelection]
  );

  return { insertTag, insertAtCursor };
}

/**
 * Hook for handling dropdown close on outside click
 */
export function useDropdownClose(
  setShowColorPicker: (show: boolean) => void,
  setShowSizePicker: (show: boolean) => void,
  setShowSmilies: (show: boolean) => void
) {
  useEffect(() => {
    const handleClickOutside = () => {
      setShowColorPicker(false);
      setShowSizePicker(false);
      setShowSmilies(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setShowColorPicker, setShowSizePicker, setShowSmilies]);
}
