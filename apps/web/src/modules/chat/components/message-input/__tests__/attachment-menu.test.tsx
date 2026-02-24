/** @module AttachmentMenu tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const cache = new Map<string | symbol, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>();
  return {
    motion: new Proxy({} as Record<string, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>, {
      get: (_target, prop) => {
        if (!cache.has(prop)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Tag = (typeof prop === 'string' ? prop : 'div') as any;
          cache.set(prop, function MotionMock({ children, className, onClick }) {
            return <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>{children}</Tag>;
          });
        }
        return cache.get(prop);
      },
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  PlusCircleIcon: () => <svg data-testid="plus-circle-icon" />,
  PhotoIcon: () => <svg data-testid="photo-icon" />,
  DocumentIcon: () => <svg data-testid="document-icon" />,
  GifIcon: () => <svg data-testid="gif-icon" />,
}));

import { AttachmentMenu } from '../attachment-menu';

describe('AttachmentMenu', () => {
  const onToggle = vi.fn();
  const onFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the toggle button with PlusCircleIcon', () => {
    render(<AttachmentMenu attachmentMode="none" onToggle={onToggle} onFileSelect={onFileSelect} />);
    expect(screen.getByTestId('plus-circle-icon')).toBeInTheDocument();
  });

  it('calls onToggle with "file" when toggle button is clicked', () => {
    render(<AttachmentMenu attachmentMode="none" onToggle={onToggle} onFileSelect={onFileSelect} />);
    const btn = screen.getByTestId('plus-circle-icon').closest('button');
    if (btn) fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith('file');
  });

  it('shows menu items when attachmentMode is "file"', () => {
    render(<AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />);
    expect(screen.getByTestId('photo-icon')).toBeInTheDocument();
    expect(screen.getByTestId('document-icon')).toBeInTheDocument();
    expect(screen.getByTestId('gif-icon')).toBeInTheDocument();
  });

  it('hides menu items when attachmentMode is "none"', () => {
    render(<AttachmentMenu attachmentMode="none" onToggle={onToggle} onFileSelect={onFileSelect} />);
    expect(screen.queryByTestId('photo-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('document-icon')).not.toBeInTheDocument();
  });

  it('calls onFileSelect when photo button is clicked', () => {
    render(<AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />);
    const photoBtn = screen.getByTestId('photo-icon').closest('button');
    if (photoBtn) fireEvent.click(photoBtn);
    expect(onFileSelect).toHaveBeenCalled();
  });

  it('calls onFileSelect when document button is clicked', () => {
    render(<AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />);
    const docBtn = screen.getByTestId('document-icon').closest('button');
    if (docBtn) fireEvent.click(docBtn);
    expect(onFileSelect).toHaveBeenCalled();
  });

  it('calls onToggle with "gif" when GIF button is clicked', () => {
    render(<AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />);
    const gifBtn = screen.getByTestId('gif-icon').closest('button');
    if (gifBtn) fireEvent.click(gifBtn);
    expect(onToggle).toHaveBeenCalledWith('gif');
  });

  it('renders three action buttons in the dropdown', () => {
    render(<AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />);
    const buttons = screen.getAllByRole('button');
    // toggle button + 3 attachment buttons
    expect(buttons.length).toBe(4);
  });
});
