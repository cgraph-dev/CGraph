/**
 * @file Tests for EmojiGrid component (emoji-picker)
 * @module chat/components/emoji-picker/emoji-grid
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      className,
      onClick,
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
    }) => (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    ),
  },
}));

import { EmojiGrid } from '../emoji-picker/emoji-grid';

describe('EmojiGrid', () => {
  const testEmojis = ['😀', '😂', '🥰', '😎', '🔥'];

  it('renders all emojis as buttons', () => {
    render(<EmojiGrid emojis={testEmojis} onEmojiClick={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('displays each emoji', () => {
    render(<EmojiGrid emojis={testEmojis} onEmojiClick={vi.fn()} />);
    for (const emoji of testEmojis) {
      expect(screen.getByText(emoji)).toBeInTheDocument();
    }
  });

  it('calls onEmojiClick with correct emoji when clicked', async () => {
    const user = userEvent.setup();
    const onEmojiClick = vi.fn();
    render(<EmojiGrid emojis={testEmojis} onEmojiClick={onEmojiClick} />);
    await user.click(screen.getByText('😎'));
    expect(onEmojiClick).toHaveBeenCalledWith('😎');
  });

  it('renders empty state when no emojis and searchQuery is provided', () => {
    render(<EmojiGrid emojis={[]} onEmojiClick={vi.fn()} searchQuery="xyz" />);
    expect(screen.getByText('No emojis found')).toBeInTheDocument();
  });

  it('does not render empty state when no emojis and no searchQuery', () => {
    render(<EmojiGrid emojis={[]} onEmojiClick={vi.fn()} />);
    expect(screen.queryByText('No emojis found')).not.toBeInTheDocument();
  });

  it('renders grid container', () => {
    const { container } = render(<EmojiGrid emojis={testEmojis} onEmojiClick={vi.fn()} />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('renders single emoji', () => {
    render(<EmojiGrid emojis={['🎉']} onEmojiClick={vi.fn()} />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('handles large emoji arrays', () => {
    const manyEmojis = Array.from({ length: 50 }, (_, i) => String.fromCodePoint(0x1f600 + i));
    render(<EmojiGrid emojis={manyEmojis} onEmojiClick={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(50);
  });

  it('renders each emoji inside a button', () => {
    render(<EmojiGrid emojis={['😀']} onEmojiClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.textContent).toBe('😀');
  });
});
