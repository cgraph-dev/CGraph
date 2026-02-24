/** @module BBCodeEditor tests */
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

vi.mock('@/components/content/bb-code-renderer', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <div data-testid="bbcode-preview">{content}</div>,
}));

vi.mock('@/lib/bbcode', () => ({
  validateBBCode: () => ({ isValid: true, errors: [] }),
  countBBCodeCharacters: (text: string) => text.length,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | boolean | undefined)[]) => args.filter(Boolean).join(' '),
}));

vi.mock('./hooks', () => ({
  useTextSelection: () => ({ getSelection: () => ({ start: 0, end: 0, text: '' }) }),
  useBBCodeInsertion: () => ({ insertTag: vi.fn(), insertAtCursor: vi.fn() }),
  useDropdownClose: vi.fn(),
}));

vi.mock('./editor-toolbar', () => ({
  EditorToolbar: (props: { isPreviewMode: boolean }) => (
    <div data-testid="editor-toolbar">{props.isPreviewMode ? 'preview' : 'edit'}</div>
  ),
}));

vi.mock('./editor-footer', () => ({
  EditorFooter: ({ charCount }: { charCount: number }) => (
    <div data-testid="editor-footer">chars:{charCount}</div>
  ),
}));

import BBCodeEditor from '../bb-code-editor';

describe('BBCodeEditor', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea with placeholder', () => {
    render(<BBCodeEditor value="" onChange={onChange} />);
    expect(screen.getByPlaceholderText('Write your message...')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<BBCodeEditor value="" onChange={onChange} placeholder="Enter BBCode..." />);
    expect(screen.getByPlaceholderText('Enter BBCode...')).toBeInTheDocument();
  });

  it('renders toolbar by default', () => {
    render(<BBCodeEditor value="" onChange={onChange} />);
    expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
  });

  it('hides toolbar when disableToolbar is true', () => {
    render(<BBCodeEditor value="" onChange={onChange} disableToolbar />);
    expect(screen.queryByTestId('editor-toolbar')).not.toBeInTheDocument();
  });

  it('renders footer with character count', () => {
    render(<BBCodeEditor value="Hello" onChange={onChange} showCharCount />);
    expect(screen.getByTestId('editor-footer')).toHaveTextContent('chars:5');
  });

  it('calls onChange when text is typed', () => {
    render(<BBCodeEditor value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Write your message...'), {
      target: { value: 'Hello' },
    });
    expect(onChange).toHaveBeenCalledWith('Hello');
  });

  it('applies custom className', () => {
    const { container } = render(<BBCodeEditor value="" onChange={onChange} className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('sets id on textarea when provided', () => {
    render(<BBCodeEditor value="" onChange={onChange} id="my-editor" />);
    expect(screen.getByPlaceholderText('Write your message...')).toHaveAttribute('id', 'my-editor');
  });

  it('applies minHeight style to textarea', () => {
    render(<BBCodeEditor value="" onChange={onChange} minHeight={200} />);
    const textarea = screen.getByPlaceholderText('Write your message...');
    expect(textarea).toHaveStyle({ minHeight: '200px' });
  });

  it('displays the current value in textarea', () => {
    render(<BBCodeEditor value="[b]Bold text[/b]" onChange={onChange} />);
    expect(screen.getByPlaceholderText('Write your message...')).toHaveValue('[b]Bold text[/b]');
  });
});
