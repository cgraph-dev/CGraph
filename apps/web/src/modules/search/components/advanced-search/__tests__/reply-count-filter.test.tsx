/** @module reply-count-filter tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReplyCountFilter } from '../reply-count-filter';

describe('ReplyCountFilter', () => {
  const defaultFilters = { minReplies: undefined, maxReplies: undefined } as Record<
    string,
    unknown
  >;

  it('renders the label', () => {
    render(<ReplyCountFilter filters={defaultFilters} updateFilter={vi.fn()} />);
    expect(screen.getByText('Reply Count')).toBeTruthy();
  });

  it('renders min and max inputs', () => {
    render(<ReplyCountFilter filters={defaultFilters} updateFilter={vi.fn()} />);
    expect(screen.getByPlaceholderText('Min')).toBeTruthy();
    expect(screen.getByPlaceholderText('Max')).toBeTruthy();
  });

  it('shows "to" separator', () => {
    render(<ReplyCountFilter filters={defaultFilters} updateFilter={vi.fn()} />);
    expect(screen.getByText('to')).toBeTruthy();
  });

  it('shows "replies" label', () => {
    render(<ReplyCountFilter filters={defaultFilters} updateFilter={vi.fn()} />);
    expect(screen.getByText('replies')).toBeTruthy();
  });

  it('calls updateFilter with minReplies on min input change', () => {
    const updateFilter = vi.fn();
    render(<ReplyCountFilter filters={defaultFilters} updateFilter={updateFilter} />);
    fireEvent.change(screen.getByPlaceholderText('Min'), { target: { value: '5' } });
    expect(updateFilter).toHaveBeenCalledWith('minReplies', 5);
  });

  it('calls updateFilter with maxReplies on max input change', () => {
    const updateFilter = vi.fn();
    render(<ReplyCountFilter filters={defaultFilters} updateFilter={updateFilter} />);
    fireEvent.change(screen.getByPlaceholderText('Max'), { target: { value: '100' } });
    expect(updateFilter).toHaveBeenCalledWith('maxReplies', 100);
  });

  it('calls updateFilter with undefined when input cleared', () => {
    const updateFilter = vi.fn();
    render(
      <ReplyCountFilter
        filters={{ minReplies: 5, maxReplies: undefined }}
        updateFilter={updateFilter}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Min'), { target: { value: '' } });
    expect(updateFilter).toHaveBeenCalledWith('minReplies', undefined);
  });

  it('displays current filter values', () => {
    render(
      <ReplyCountFilter filters={{ minReplies: 10, maxReplies: 50 }} updateFilter={vi.fn()} />
    );
    expect((screen.getByPlaceholderText('Min') as HTMLInputElement).value).toBe('10');
    expect((screen.getByPlaceholderText('Max') as HTMLInputElement).value).toBe('50');
  });
});
