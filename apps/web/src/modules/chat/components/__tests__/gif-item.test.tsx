/** @module gif-item tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

import { GifItem } from '../gif-picker/gif-item';

const sampleGif = {
  id: 'gif-1',
  title: 'Funny cat',
  url: 'https://example.com/gif.gif',
  previewUrl: 'https://example.com/preview.gif',
  width: 200,
  height: 150,
  source: 'tenor' as const,
};

describe('GifItem', () => {
  const defaultProps = {
    gif: sampleGif,
    onSelect: vi.fn(),
    isFavorite: false,
    onToggleFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders gif image', () => {
    render(<GifItem {...defaultProps} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    render(<GifItem {...defaultProps} />);
    const img = screen.getByRole('img');
    fireEvent.click(img.closest('div')!);
    expect(defaultProps.onSelect).toHaveBeenCalledWith(sampleGif);
  });

  it('shows outline heart when not favorited', () => {
    render(<GifItem {...defaultProps} isFavorite={false} />);
    const container = screen.getByRole('img').closest('div')!;
    fireEvent.mouseEnter(container);
    expect(screen.getByTestId('icon-HeartIcon')).toBeInTheDocument();
  });

  it('shows solid heart when favorited', () => {
    render(<GifItem {...defaultProps} isFavorite={true} />);
    const container = screen.getByRole('img').closest('div')!;
    fireEvent.mouseEnter(container);
    expect(screen.getByTestId('icon-HeartIcon')).toBeInTheDocument();
  });

  it('calls onToggleFavorite when heart clicked', () => {
    render(<GifItem {...defaultProps} />);
    const container = screen.getByRole('img').closest('div')!;
    fireEvent.mouseEnter(container);
    const heartBtn = screen.getByTestId('icon-HeartIcon').closest('button')!;
    fireEvent.click(heartBtn);
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith(sampleGif);
  });
});
