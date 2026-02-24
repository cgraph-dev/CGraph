/**
 * @file Tests for EmojiSearch component (emoji-picker)
 * @module chat/components/emoji-picker/emoji-search
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: ({ className }: { className?: string }) => (
    <span data-testid="search-icon" className={className} />
  ),
  XMarkIcon: ({ className }: { className?: string }) => (
    <span data-testid="clear-icon" className={className} />
  ),
}));

import { EmojiSearch } from '../emoji-picker/emoji-search';

describe('EmojiSearch', () => {
  it('renders search input with placeholder', () => {
    render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
  });

  it('renders search icon', () => {
    render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('displays current search query', () => {
    render(<EmojiSearch searchQuery="smile" onSearchChange={vi.fn()} />);
    expect(screen.getByDisplayValue('smile')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<EmojiSearch searchQuery="" onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Search emojis...');
    await user.type(input, 'h');
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('shows clear button when search query is present', () => {
    render(<EmojiSearch searchQuery="hello" onSearchChange={vi.fn()} />);
    expect(screen.getByTestId('clear-icon')).toBeInTheDocument();
  });

  it('does not show clear button when search query is empty', () => {
    render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    expect(screen.queryByTestId('clear-icon')).not.toBeInTheDocument();
  });

  it('clears search query when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<EmojiSearch searchQuery="hello" onSearchChange={onSearchChange} />);
    // The clear button wraps the XMarkIcon — click the button parent
    const clearIcon = screen.getByTestId('clear-icon');
    await user.click(clearIcon.closest('button')!);
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('renders as a text input', () => {
    render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search emojis...');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('input is focusable', async () => {
    const user = userEvent.setup();
    render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search emojis...');
    await user.click(input);
    expect(input).toHaveFocus();
  });
});
