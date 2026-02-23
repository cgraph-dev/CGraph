/**
 * @file Tests for BackgroundParticles component
 * @module gamification/components/level-up-modal/background-particles
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...rest }: Record<string, unknown>) => (
      <div
        className={className as string}
        style={style as React.CSSProperties}
        data-testid="particle"
      >
        {children as React.ReactNode}
      </div>
    ),
  },
}));

import BackgroundParticles from '../level-up-modal/background-particles';

describe('BackgroundParticles', () => {
  it('renders 30 particles', () => {
    const { container } = render(<BackgroundParticles />);
    const particles = container.querySelectorAll('[data-testid="particle"]');
    // One wrapper div + 30 particle divs = 31, but the wrapper is also a plain div
    // The inner particles are the ones with data-testid="particle"
    // Actually the outer div is pointer-events-none and not a motion.div
    // Only the 30 inner motion.divs get data-testid="particle"
    expect(particles.length).toBe(30);
  });

  it('renders inside a container with pointer-events-none', () => {
    const { container } = render(<BackgroundParticles />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('pointer-events-none');
  });

  it('renders inside a container with overflow-hidden', () => {
    const { container } = render(<BackgroundParticles />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('overflow-hidden');
  });

  it('renders particles with rounded-full class', () => {
    const { container } = render(<BackgroundParticles />);
    const particles = container.querySelectorAll('[data-testid="particle"]');
    expect(particles[0]?.className).toContain('rounded-full');
  });

  it('renders particles with absolute positioning', () => {
    const { container } = render(<BackgroundParticles />);
    const particles = container.querySelectorAll('[data-testid="particle"]');
    expect(particles[0]?.className).toContain('absolute');
  });

  it('applies gradient background styles to particles', () => {
    const { container } = render(<BackgroundParticles />);
    const particles = container.querySelectorAll('[data-testid="particle"]');
    const style = (particles[0] as HTMLElement).style;
    expect(style.background).toContain('linear-gradient');
  });

  it('applies left and top positioning styles', () => {
    const { container } = render(<BackgroundParticles />);
    const particles = container.querySelectorAll('[data-testid="particle"]');
    const style = (particles[0] as HTMLElement).style;
    expect(style.left).toBeTruthy();
    expect(style.top).toBeTruthy();
  });

  it('renders wrapper with inset-0 for full coverage', () => {
    const { container } = render(<BackgroundParticles />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('inset-0');
  });
});
