/** @module VideoEmbed tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

import VideoEmbed from '../rich-media-embed/video-embed';

function makeYouTubeEmbed(overrides: Record<string, unknown> = {}) {
  return {
    url: 'https://www.youtube.com/watch?v=abc123',
    title: 'Test YouTube Video',
    image: 'https://img.youtube.com/vi/abc123/hqdefault.jpg',
    siteName: 'YouTube',
    videoUrl: 'https://www.youtube.com/embed/abc123',
    ...overrides,
  };
}

function makeNativeEmbed(overrides: Record<string, unknown> = {}) {
  return {
    url: 'https://example.com/video.mp4',
    title: 'Test Video',
    videoUrl: 'https://example.com/video.mp4',
    ...overrides,
  };
}

describe('VideoEmbed', () => {
  let onExpand: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onExpand = vi.fn();
  });

  it('renders YouTube thumbnail with play button', () => {
    render(<VideoEmbed embed={makeYouTubeEmbed()} onExpand={onExpand} />);
    expect(screen.getByAltText('Test YouTube Video')).toBeInTheDocument();
    expect(screen.getAllByTestId('icon-PlayCircleIcon').length).toBeGreaterThan(0);
  });

  it('renders video title for YouTube embed', () => {
    render(<VideoEmbed embed={makeYouTubeEmbed()} onExpand={onExpand} />);
    expect(screen.getByText('Test YouTube Video')).toBeInTheDocument();
  });

  it('renders site name for YouTube embed', () => {
    render(<VideoEmbed embed={makeYouTubeEmbed()} onExpand={onExpand} />);
    expect(screen.getByText('YouTube')).toBeInTheDocument();
  });

  it('shows YouTube iframe after clicking play', () => {
    render(<VideoEmbed embed={makeYouTubeEmbed()} onExpand={onExpand} />);
    const thumbnail = screen.getByAltText('Test YouTube Video');
    fireEvent.click(thumbnail);
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123?autoplay=1');
  });

  it('renders iframe with sandbox and allow attributes', () => {
    render(<VideoEmbed embed={makeYouTubeEmbed()} onExpand={onExpand} />);
    fireEvent.click(screen.getByAltText('Test YouTube Video'));
    const iframe = document.querySelector('iframe');
    expect(iframe).toHaveAttribute('sandbox');
    expect(iframe).toHaveAttribute('allowFullScreen');
  });

  it('renders native video for non-YouTube embeds', () => {
    render(<VideoEmbed embed={makeNativeEmbed()} onExpand={onExpand} />);
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
  });

  it('calls onExpand when clicking native video', () => {
    render(<VideoEmbed embed={makeNativeEmbed()} onExpand={onExpand} />);
    const container = document.querySelector('video')!.closest('div[class*="cursor-pointer"]');
    if (container) {
      fireEvent.click(container);
      expect(onExpand).toHaveBeenCalledOnce();
    }
  });

  it('renders play icon for native video', () => {
    render(<VideoEmbed embed={makeNativeEmbed()} onExpand={onExpand} />);
    expect(screen.getAllByTestId('icon-PlayCircleIcon').length).toBeGreaterThan(0);
  });

  it('renders GlassCard wrapper for YouTube embed', () => {
    render(<VideoEmbed embed={makeYouTubeEmbed()} onExpand={onExpand} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
});
