/** @module read-receipts tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ReadReceipts } from '../message-bubble/read-receipts';

describe('ReadReceipts', () => {
  it('renders avatar images for readers with avatarUrl', () => {
    const readBy = [
      { id: '1', userId: 'u1', readAt: '2026-02-24T12:00:00Z', avatarUrl: 'https://example.com/a.png', username: 'alice' },
      { id: '2', userId: 'u2', readAt: '2026-02-24T12:01:00Z', avatarUrl: 'https://example.com/b.png', username: 'bob' },
    ];
    render(<ReadReceipts readBy={readBy} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
  });

  it('renders initials when no avatarUrl', () => {
    const readBy = [
      { id: '1', userId: 'u1', readAt: '2026-02-24T12:00:00Z', avatarUrl: undefined, username: 'alice' },
    ];
    render(<ReadReceipts readBy={readBy} />);
    expect(screen.getByText('a')).toBeInTheDocument();
  });

  it('shows Seen label', () => {
    const readBy = [
      { id: '1', userId: 'u1', readAt: '2026-02-24T12:00:00Z', avatarUrl: undefined, username: 'alice' },
    ];
    render(<ReadReceipts readBy={readBy} />);
    expect(screen.getByText('Seen')).toBeInTheDocument();
  });

  it('shows +N overflow when more than 3 readers', () => {
    const readBy = [
      { id: '1', userId: 'u1', readAt: '', avatarUrl: undefined, username: 'a' },
      { id: '2', userId: 'u2', readAt: '', avatarUrl: undefined, username: 'b' },
      { id: '3', userId: 'u3', readAt: '', avatarUrl: undefined, username: 'c' },
      { id: '4', userId: 'u4', readAt: '', avatarUrl: undefined, username: 'd' },
      { id: '5', userId: 'u5', readAt: '', avatarUrl: undefined, username: 'e' },
    ];
    render(<ReadReceipts readBy={readBy} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('only shows first 3 avatars', () => {
    const readBy = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      userId: `u${i}`,
      readAt: '',
      avatarUrl: `https://example.com/${i}.png`,
      username: `user${i}`,
    }));
    render(<ReadReceipts readBy={readBy} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(3);
  });
});
