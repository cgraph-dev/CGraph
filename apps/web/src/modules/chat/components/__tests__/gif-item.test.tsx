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
    expect(screen.getByTestId('heart-outline')).toBeInTheDocument();
  });

  it('shows solid heart when favorited', () => {
    render(<GifItem {...defaultProps} isFavorite={true} />);
    expect(screen.getByTestId('heart-solid')).toBeInTheDocument();
  });

  it('calls onToggleFavorite when heart clicked', () => {
    render(<GifItem {...defaultProps} />);
    const heartBtn = screen.getByTestId('heart-outline').closest('button');
    if (heartBtn) fireEvent.click(heartBtn);
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith(sampleGif);
  });
});
