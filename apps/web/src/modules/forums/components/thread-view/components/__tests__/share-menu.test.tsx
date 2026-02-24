/** @module ShareMenu tests */
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

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { success: vi.fn(), light: vi.fn() },
}));

import { ShareMenu } from '../share-menu';
import { HapticFeedback } from '@/lib/animations/animation-engine';

describe('ShareMenu', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders when isOpen is true', () => {
    render(<ShareMenu isOpen postTitle="Test Post" onClose={onClose} />);
    expect(screen.getByText('Copy link')).toBeInTheDocument();
    expect(screen.getByText('Share on Twitter')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ShareMenu isOpen={false} postTitle="Test Post" onClose={onClose} />);
    expect(screen.queryByText('Copy link')).not.toBeInTheDocument();
  });

  it('copies link to clipboard on Copy link click', () => {
    render(<ShareMenu isOpen postTitle="Test Post" onClose={onClose} />);
    fireEvent.click(screen.getByText('Copy link'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('triggers haptic feedback on copy', () => {
    render(<ShareMenu isOpen postTitle="Test Post" onClose={onClose} />);
    fireEvent.click(screen.getByText('Copy link'));
    expect(HapticFeedback.success).toHaveBeenCalled();
  });

  it('calls onClose after copy', () => {
    render(<ShareMenu isOpen postTitle="Test Post" onClose={onClose} />);
    fireEvent.click(screen.getByText('Copy link'));
    expect(onClose).toHaveBeenCalled();
  });

  it('opens Twitter share link on Share on Twitter click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareMenu isOpen postTitle="My Post" onClose={onClose} />);
    fireEvent.click(screen.getByText('Share on Twitter'));
    expect(openSpy).toHaveBeenCalled();
    const url = openSpy.mock.calls[0][0] as string;
    expect(url).toContain('twitter.com/intent/tweet');
    expect(url).toContain(encodeURIComponent('My Post'));
    openSpy.mockRestore();
  });

  it('calls onClose after sharing on Twitter', () => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareMenu isOpen postTitle="Test Post" onClose={onClose} />);
    fireEvent.click(screen.getByText('Share on Twitter'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders two action buttons', () => {
    render(<ShareMenu isOpen postTitle="Test Post" onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });
});
