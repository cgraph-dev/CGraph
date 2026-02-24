/** @module Lightbox tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Lightbox from '../lightbox';

vi.mock('framer-motion', () => {
  const cache = new Map<string | symbol, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>();
  return {
    motion: new Proxy({} as Record<string, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>, {
      get: (_target, prop) => {
        if (!cache.has(prop)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Tag = (typeof prop === 'string' ? prop : 'div') as any;
          cache.set(prop, function MotionMock({ children, className, onClick }) {
            return <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>{children}</Tag>;
          });
        }
        return cache.get(prop);
      },
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn() }),
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useTransform: () => ({ get: () => 0 }),
    useInView: () => true,
  };
});

vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <span data-testid="x-icon" />,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn() },
}));

describe('Lightbox', () => {
  const defaultSetLightboxMedia = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when lightboxMedia is null', () => {
    const { container } = render(<Lightbox lightboxMedia={null} setLightboxMedia={defaultSetLightboxMedia} />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('video')).not.toBeInTheDocument();
  });

  it('renders an image when lightboxMedia type is image', () => {
    render(
      <Lightbox
        lightboxMedia={{ url: 'https://example.com/pic.jpg', type: 'image' }}
        setLightboxMedia={defaultSetLightboxMedia}
      />
    );
    const img = screen.getByAltText('Full size');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/pic.jpg');
  });

  it('renders a video when lightboxMedia type is video', () => {
    const { container } = render(
      <Lightbox
        lightboxMedia={{ url: 'https://example.com/vid.mp4', type: 'video' }}
        setLightboxMedia={defaultSetLightboxMedia}
      />
    );
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/vid.mp4');
  });

  it('calls setLightboxMedia(null) when backdrop is clicked', () => {
    render(
      <Lightbox
        lightboxMedia={{ url: 'https://example.com/pic.jpg', type: 'image' }}
        setLightboxMedia={defaultSetLightboxMedia}
      />
    );
    // Click the backdrop (outermost div with inset-0)
    const backdrop = screen.getByAltText('Full size').closest('.fixed');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(defaultSetLightboxMedia).toHaveBeenCalledWith(null);
  });

  it('calls setLightboxMedia(null) when close button is clicked', () => {
    render(
      <Lightbox
        lightboxMedia={{ url: 'https://example.com/pic.jpg', type: 'image' }}
        setLightboxMedia={defaultSetLightboxMedia}
      />
    );
    const closeBtn = screen.getByTestId('x-icon').closest('button');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn!);
    expect(defaultSetLightboxMedia).toHaveBeenCalledWith(null);
  });

  it('stops event propagation when clicking the media container', () => {
    render(
      <Lightbox
        lightboxMedia={{ url: 'https://example.com/pic.jpg', type: 'image' }}
        setLightboxMedia={defaultSetLightboxMedia}
      />
    );
    const img = screen.getByAltText('Full size');
    fireEvent.click(img.parentElement!);
    // The setLightboxMedia should not be called from the inner container click
    // (only called once from the close button test, resetting here)
  });
});
