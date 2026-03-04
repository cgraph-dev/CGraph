/**
 * HeroSection — Liquid Glass hero component tests.
 *
 * Verifies heading text, CTA buttons, and crash-free rendering.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// ── Three.js mocks ──────────────────────────────────────────────────────────
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({ viewport: { width: 10, height: 10 }, size: { width: 800, height: 600 } }),
}));
vi.mock('@react-three/drei', () => ({
  Float: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MeshTransmissionMaterial: () => null,
  Environment: () => null,
  PerspectiveCamera: () => null,
}));
vi.mock('three', () => ({
  Color: vi.fn(),
  Vector3: vi.fn(() => ({ set: vi.fn() })),
  MeshPhysicalMaterial: vi.fn(),
  SphereGeometry: vi.fn(),
  IcosahedronGeometry: vi.fn(),
}));

// ── Framer Motion mock ──────────────────────────────────────────────────────
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    motion: new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (typeof prop === 'string') {
            return ({ children, ...props }: Record<string, unknown>) => {
              const {
                initial: _initial,
                animate: _animate,
                exit: _exit,
                whileHover: _whileHover,
                whileInView: _whileInView,
                whileTap: _whileTap,
                transition: _transition,
                variants: _variants,
                viewport: _viewport,
                ...rest
              } = props;
              const Tag = prop as keyof JSX.IntrinsicElements;
              return <Tag {...rest}>{children}</Tag>;
            };
          }
          return undefined;
        },
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useScroll: () => ({ scrollYProgress: { onChange: vi.fn(), get: () => 0 } }),
    useTransform: () => 0,
    useMotionValue: () => ({ get: vi.fn(() => 0), set: vi.fn() }),
    useSpring: () => ({ get: vi.fn(() => 0), set: vi.fn() }),
  };
});

// ── React-router-dom mock ───────────────────────────────────────────────────
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      [key: string]: unknown;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => vi.fn(),
  };
});

import { HeroSection } from '@/components/liquid-glass';

describe('HeroSection', () => {
  it('renders the hero heading', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Chat that's/i)).toBeInTheDocument();
    expect(screen.getByText(/actually private/i)).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<HeroSection />);
    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
    expect(screen.getByText('See Features')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(<HeroSection />);
    expect(container.querySelector('section')).toBeInTheDocument();
  });
});
