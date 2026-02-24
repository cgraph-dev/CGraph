/** @module CommentForm tests */
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
          cache.set(prop, function MotionMock({ children, className, onClick, disabled, style }) {
            return (
              <Tag
                className={className as string}
                onClick={onClick as React.MouseEventHandler}
                disabled={disabled as boolean}
                style={style as React.CSSProperties}
              >
                {children}
              </Tag>
            );
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

import { CommentForm } from '../comment-form';

const defaultProps = {
  isOpen: true,
  content: '',
  setContent: vi.fn(),
  isSubmitting: false,
  primaryColor: '#3b82f6',
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe('CommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea when isOpen is true', () => {
    render(<CommentForm {...defaultProps} />);
    expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<CommentForm {...defaultProps} isOpen={false} />);
    expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
  });

  it('calls setContent on textarea change', () => {
    render(<CommentForm {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), {
      target: { value: 'New comment' },
    });
    expect(defaultProps.setContent).toHaveBeenCalledWith('New comment');
  });

  it('renders Cancel button', () => {
    render(<CommentForm {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<CommentForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('renders Post Comment button', () => {
    render(<CommentForm {...defaultProps} />);
    expect(screen.getByText('Post Comment')).toBeInTheDocument();
  });

  it('disables submit button when content is empty', () => {
    render(<CommentForm {...defaultProps} content="" />);
    expect(screen.getByText('Post Comment')).toBeDisabled();
  });

  it('enables submit button when content is not empty', () => {
    render(<CommentForm {...defaultProps} content="Hello" />);
    expect(screen.getByText('Post Comment')).not.toBeDisabled();
  });

  it('shows "Posting..." text when isSubmitting is true', () => {
    render(<CommentForm {...defaultProps} content="Hello" isSubmitting />);
    expect(screen.getByText('Posting...')).toBeInTheDocument();
  });

  it('displays current content in textarea', () => {
    render(<CommentForm {...defaultProps} content="My comment text" />);
    expect(screen.getByPlaceholderText('Write a comment...')).toHaveValue('My comment text');
  });
});
