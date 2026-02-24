/**
 * @file Tests for MessageParticles component
 * @module chat/components/message-particles
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
    }) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
  },
}));

import { MessageParticles } from '../message-particles';

describe('MessageParticles', () => {
  it('renders container div', () => {
    const { container } = render(<MessageParticles isOwnMessage={true} />);
    expect(container.querySelector('.pointer-events-none')).toBeInTheDocument();
  });

  it('renders 6 particle elements', () => {
    const { container } = render(<MessageParticles isOwnMessage={true} />);
    const particles = container.querySelectorAll('.rounded-full');
    expect(particles).toHaveLength(6);
  });

  it('positions particles on right side for own messages', () => {
    const { container } = render(<MessageParticles isOwnMessage={true} />);
    const particles = container.querySelectorAll('.rounded-full');
    particles.forEach((particle) => {
      expect(particle).toHaveStyle({ left: '90%' });
    });
  });

  it('positions particles on left side for other messages', () => {
    const { container } = render(<MessageParticles isOwnMessage={false} />);
    const particles = container.querySelectorAll('.rounded-full');
    particles.forEach((particle) => {
      expect(particle).toHaveStyle({ left: '10%' });
    });
  });

  it('renders with overflow hidden', () => {
    const { container } = render(<MessageParticles isOwnMessage={true} />);
    expect(container.querySelector('.overflow-hidden')).toBeInTheDocument();
  });

  it('renders with absolute positioning', () => {
    const { container } = render(<MessageParticles isOwnMessage={true} />);
    expect(container.querySelector('.absolute')).toBeInTheDocument();
  });

  it('particles have bg-primary-400 class', () => {
    const { container } = render(<MessageParticles isOwnMessage={true} />);
    const particles = container.querySelectorAll('.bg-primary-400');
    expect(particles.length).toBeGreaterThan(0);
  });
});
