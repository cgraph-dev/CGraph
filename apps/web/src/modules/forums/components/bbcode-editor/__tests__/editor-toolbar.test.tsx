/** @module EditorToolbar tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | boolean | undefined)[]) => args.filter(Boolean).join(' '),
}));

vi.mock('./color-picker', () => ({
  ColorPicker: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="color-picker" /> : <div data-testid="color-picker-closed" />,
}));

vi.mock('./size-picker', () => ({
  SizePicker: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="size-picker" /> : <div data-testid="size-picker-closed" />,
}));

vi.mock('./smilies-picker', () => ({
  SmiliesPicker: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="smilies-picker" /> : <div data-testid="smilies-picker-closed" />,
}));

import { EditorToolbar } from '../editor-toolbar';

const defaultProps = {
  insertTag: vi.fn(),
  insertAtCursor: vi.fn(),
  promptLink: vi.fn(),
  promptImage: vi.fn(),
  promptYouTube: vi.fn(),
  showColorPicker: false,
  setShowColorPicker: vi.fn(),
  showSizePicker: false,
  setShowSizePicker: vi.fn(),
  showSmilies: false,
  setShowSmilies: vi.fn(),
  showPreview: true,
  isPreviewMode: false,
  setIsPreviewMode: vi.fn(),
};

describe('EditorToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bold button', () => {
    render(<EditorToolbar {...defaultProps} />);
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
  });

  it('calls insertTag for bold on click', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Bold'));
    expect(defaultProps.insertTag).toHaveBeenCalledWith('[b]', '[/b]');
  });

  it('renders italic button and calls insertTag', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Italic'));
    expect(defaultProps.insertTag).toHaveBeenCalledWith('[i]', '[/i]');
  });

  it('calls promptLink when link button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Insert Link'));
    expect(defaultProps.promptLink).toHaveBeenCalled();
  });

  it('calls promptImage when image button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Insert Image'));
    expect(defaultProps.promptImage).toHaveBeenCalled();
  });

  it('calls promptYouTube when YouTube button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Insert YouTube'));
    expect(defaultProps.promptYouTube).toHaveBeenCalled();
  });

  it('renders preview toggle when showPreview is true', () => {
    render(<EditorToolbar {...defaultProps} />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows Edit text when in preview mode', () => {
    render(<EditorToolbar {...defaultProps} isPreviewMode />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('calls setIsPreviewMode when preview button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Preview'));
    expect(defaultProps.setIsPreviewMode).toHaveBeenCalledWith(true);
  });

  it('renders code block button and calls insertTag', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Code Block'));
    expect(defaultProps.insertTag).toHaveBeenCalledWith('[code]', '[/code]');
  });
});
