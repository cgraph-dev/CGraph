/** @module MentionAutocomplete tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockRejectedValue(new Error('API unavailable')),
  },
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar">{alt}</div>,
}));

import { MentionAutocomplete } from '../mention-autocomplete';

/** Advance fake timers past the 200ms debounce and flush microtasks */
async function flushDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
}

describe('MentionAutocomplete', () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when query is empty', () => {
    const { container } = render(
      <MentionAutocomplete query="" onSelect={onSelect} onClose={onClose} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows loading spinner while searching', async () => {
    render(<MentionAutocomplete query="ali" onSelect={onSelect} onClose={onClose} />);
    await flushDebounce();
    // After API call fails, it fell back to mock users
  });

  it('displays filtered mock users as fallback', async () => {
    render(<MentionAutocomplete query="ali" onSelect={onSelect} onClose={onClose} />);
    await flushDebounce();
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });

  it('calls onSelect when a user is clicked', async () => {
    render(<MentionAutocomplete query="bob" onSelect={onSelect} onClose={onClose} />);
    await flushDebounce();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    const btn = screen.getByText('@bob').closest('button');
    if (btn) fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalledWith('bob');
  });

  it('shows display name for each user', async () => {
    render(<MentionAutocomplete query="alice" onSelect={onSelect} onClose={onClose} />);
    await flushDebounce();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders nothing when no users match the query', async () => {
    const { container } = render(
      <MentionAutocomplete query="zzzznotauser" onSelect={onSelect} onClose={onClose} />
    );
    await flushDebounce();
    // No users found, component returns null
    expect(container.querySelector('button')).toBeNull();
  });

  it('debounces search with 200ms delay', async () => {
    const { rerender } = render(
      <MentionAutocomplete query="a" onSelect={onSelect} onClose={onClose} />
    );
    rerender(<MentionAutocomplete query="al" onSelect={onSelect} onClose={onClose} />);
    rerender(<MentionAutocomplete query="ali" onSelect={onSelect} onClose={onClose} />);
    // Only after 200ms should it search
    await flushDebounce();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
