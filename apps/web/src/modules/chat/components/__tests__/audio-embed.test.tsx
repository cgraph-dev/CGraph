/**
 * @file Tests for AudioEmbed component (rich-media-embed)
 * @module chat/components/rich-media-embed/audio-embed
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  MusicalNoteIcon: ({ className }: { className?: string }) => (
    <span data-testid="music-icon" className={className} />
  ),
}));

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

import AudioEmbed from '../rich-media-embed/audio-embed';

function makeEmbed(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Audio Track',
    url: 'https://example.com/audio.mp3',
    audioUrl: 'https://example.com/audio-direct.mp3',
    ...overrides,
  };
}

describe('AudioEmbed', () => {
  it('renders the audio title', () => {
    render(<AudioEmbed embed={makeEmbed()} />);
    expect(screen.getByText('Test Audio Track')).toBeInTheDocument();
  });

  it('renders "Audio File" label', () => {
    render(<AudioEmbed embed={makeEmbed()} />);
    expect(screen.getByText('Audio File')).toBeInTheDocument();
  });

  it('renders music icon', () => {
    render(<AudioEmbed embed={makeEmbed()} />);
    expect(screen.getByTestId('music-icon')).toBeInTheDocument();
  });

  it('renders GlassCard with frosted variant', () => {
    render(<AudioEmbed embed={makeEmbed()} />);
    expect(screen.getByTestId('glass-card')).toHaveAttribute('data-variant', 'frosted');
  });

  it('renders audio element with audioUrl', () => {
    render(<AudioEmbed embed={makeEmbed()} />);
    const audio = document.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute('src', 'https://example.com/audio-direct.mp3');
  });

  it('falls back to url when audioUrl is not provided', () => {
    render(<AudioEmbed embed={makeEmbed({ audioUrl: undefined })} />);
    const audio = document.querySelector('audio');
    expect(audio).toHaveAttribute('src', 'https://example.com/audio.mp3');
  });

  it('renders audio element with controls', () => {
    render(<AudioEmbed embed={makeEmbed()} />);
    const audio = document.querySelector('audio');
    expect(audio).toHaveAttribute('controls');
  });

  it('sets preload to metadata', () => {
    render(<AudioEmbed embed={makeEmbed()} />);
    const audio = document.querySelector('audio');
    expect(audio).toHaveAttribute('preload', 'metadata');
  });

  it('truncates long titles', () => {
    render(<AudioEmbed embed={makeEmbed({ title: 'A Very Long Audio Title' })} />);
    const titleEl = screen.getByText('A Very Long Audio Title');
    expect(titleEl.className).toContain('truncate');
  });
});
