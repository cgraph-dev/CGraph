/** @module EmptyCommentsState tests */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftIcon: () => <svg data-testid="chat-bubble-icon" />,
}));

import { EmptyCommentsState } from '../empty-state';

describe('EmptyCommentsState', () => {
  it('renders the empty message', () => {
    render(<EmptyCommentsState />);
    expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
  });

  it('renders chat bubble icon', () => {
    render(<EmptyCommentsState />);
    expect(screen.getByTestId('chat-bubble-icon')).toBeInTheDocument();
  });

  it('renders inside GlassCard', () => {
    render(<EmptyCommentsState />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('applies frosted variant class', () => {
    render(<EmptyCommentsState />);
    expect(screen.getByTestId('glass-card')).toHaveClass('p-8');
  });

  it('applies text-center class', () => {
    render(<EmptyCommentsState />);
    expect(screen.getByTestId('glass-card')).toHaveClass('text-center');
  });

  it('renders as a paragraph element', () => {
    render(<EmptyCommentsState />);
    const msg = screen.getByText('No comments yet. Be the first to comment!');
    expect(msg.tagName).toBe('P');
  });
});
