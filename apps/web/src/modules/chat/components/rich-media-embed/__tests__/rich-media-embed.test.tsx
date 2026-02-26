/** @module RichMediaEmbed tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RichMediaEmbed from '../rich-media-embed';

const mockUseMediaEmbeds = vi.fn();

vi.mock('../hooks', () => ({
  useMediaEmbeds: (...args: unknown[]) => mockUseMediaEmbeds(...args),
}));

vi.mock('../lightbox', () => ({
  __esModule: true,
  default: ({ lightboxMedia }: { lightboxMedia: unknown }) => (
    <div data-testid="lightbox" data-open={String(!!lightboxMedia)} />
  ),
}));

vi.mock('../image-embed', () => ({
  __esModule: true,
  default: ({ embed }: { embed: { url: string } }) => (
    <div data-testid="image-embed">{embed.url}</div>
  ),
}));

vi.mock('../video-embed', () => ({
  __esModule: true,
  default: ({ embed }: { embed: { url: string } }) => (
    <div data-testid="video-embed">{embed.url}</div>
  ),
}));

vi.mock('../audio-embed', () => ({
  __esModule: true,
  default: ({ embed }: { embed: { url: string } }) => (
    <div data-testid="audio-embed">{embed.url}</div>
  ),
}));

vi.mock('../link-preview', () => ({
  __esModule: true,
  default: ({ embed }: { embed: { url: string } }) => (
    <div data-testid="link-preview">{embed.url}</div>
  ),
}));

describe('RichMediaEmbed', () => {
  const defaultProps = {
    content: 'Check this out https://example.com/image.jpg',
    isOwnMessage: false,
    onLoad: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMediaEmbeds.mockReturnValue({ embeds: [], isLoading: false });
  });

  it('returns null when loading', () => {
    mockUseMediaEmbeds.mockReturnValue({ embeds: [], isLoading: true });
    const { container } = render(<RichMediaEmbed {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when no embeds found', () => {
    mockUseMediaEmbeds.mockReturnValue({ embeds: [], isLoading: false });
    const { container } = render(<RichMediaEmbed {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders image embed for image type', () => {
    mockUseMediaEmbeds.mockReturnValue({
      embeds: [{ url: 'https://example.com/pic.jpg', type: 'image' }],
      isLoading: false,
    });
    render(<RichMediaEmbed {...defaultProps} />);
    expect(screen.getByTestId('image-embed')).toBeInTheDocument();
  });

  it('renders video embed for video type', () => {
    mockUseMediaEmbeds.mockReturnValue({
      embeds: [{ url: 'https://example.com/vid.mp4', type: 'video' }],
      isLoading: false,
    });
    render(<RichMediaEmbed {...defaultProps} />);
    expect(screen.getByTestId('video-embed')).toBeInTheDocument();
  });

  it('renders audio embed for audio type', () => {
    mockUseMediaEmbeds.mockReturnValue({
      embeds: [{ url: 'https://example.com/song.mp3', type: 'audio' }],
      isLoading: false,
    });
    render(<RichMediaEmbed {...defaultProps} />);
    expect(screen.getByTestId('audio-embed')).toBeInTheDocument();
  });

  it('renders link preview for website type', () => {
    mockUseMediaEmbeds.mockReturnValue({
      embeds: [{ url: 'https://example.com', type: 'website' }],
      isLoading: false,
    });
    render(<RichMediaEmbed {...defaultProps} />);
    expect(screen.getByTestId('link-preview')).toBeInTheDocument();
  });

  it('renders lightbox component', () => {
    mockUseMediaEmbeds.mockReturnValue({
      embeds: [{ url: 'https://example.com/pic.jpg', type: 'image' }],
      isLoading: false,
    });
    render(<RichMediaEmbed {...defaultProps} />);
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
  });

  it('passes content to useMediaEmbeds hook', () => {
    render(<RichMediaEmbed {...defaultProps} />);
    expect(mockUseMediaEmbeds).toHaveBeenCalledWith(defaultProps.content, defaultProps.onLoad);
  });
});
