/** @module ImageEmbed tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import ImageEmbed from '../rich-media-embed/image-embed';

function makeEmbed(overrides: Record<string, unknown> = {}) {
  return {
    url: 'https://example.com/photo.jpg',
    title: 'Test Photo',
    ...overrides,
  };
}

describe('ImageEmbed', () => {
  let onExpand: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onExpand = vi.fn();
  });

  it('renders the image with correct src', () => {
    render(<ImageEmbed embed={makeEmbed()} onExpand={onExpand} />);
    const img = screen.getByAlt('Test Photo');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('uses fallback alt text when title is not provided', () => {
    render(<ImageEmbed embed={makeEmbed({ title: undefined })} onExpand={onExpand} />);
    expect(screen.getByAlt('Image')).toBeInTheDocument();
  });

  it('calls onExpand when clicked', () => {
    render(<ImageEmbed embed={makeEmbed()} onExpand={onExpand} />);
    fireEvent.click(screen.getByAlt('Test Photo'));
    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('shows loading spinner before image loads', () => {
    render(<ImageEmbed embed={makeEmbed()} onExpand={onExpand} />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('hides loading spinner after image loads', () => {
    render(<ImageEmbed embed={makeEmbed()} onExpand={onExpand} />);
    const img = screen.getByAlt('Test Photo');
    fireEvent.load(img);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });

  it('renders photo icon in hover overlay', () => {
    render(<ImageEmbed embed={makeEmbed()} onExpand={onExpand} />);
    expect(screen.getByTestId('photo-icon')).toBeInTheDocument();
  });

  it('renders expand icon in hover overlay', () => {
    render(<ImageEmbed embed={makeEmbed()} onExpand={onExpand} />);
    expect(screen.getByTestId('expand-icon')).toBeInTheDocument();
  });

  it('applies lazy loading to the image', () => {
    render(<ImageEmbed embed={makeEmbed()} onExpand={onExpand} />);
    const img = screen.getByAlt('Test Photo');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders as a clickable container', () => {
    const { container } = render(<ImageEmbed embed={makeEmbed()} onExpand={onExpand} />);
    const wrapper = container.firstChild;
    expect(wrapper).toBeInTheDocument();
    expect((wrapper as HTMLElement).className).toContain('cursor-pointer');
  });
});
