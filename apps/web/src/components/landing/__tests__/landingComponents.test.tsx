import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Component = (props: any) => {
          const { children, variants, initial, whileInView, whileHover, viewport, ...rest } = props;
          const El = tag as any;
          return (
            <El data-variants={variants ? 'true' : undefined} {...rest}>
              {children}
            </El>
          );
        };
        Component.displayName = `motion.${String(tag)}`;
        return Component;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useTransform: () => 0,
  useSpring: () => ({ set: vi.fn(), get: () => 0 }),
  useInView: () => true,
  useScroll: () => ({ scrollYProgress: { get: () => 0, set: vi.fn() } }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

import { GlassCard } from '../GlassCard';
import { BentoGrid, BentoItem } from '../BentoGrid';
import { KineticText } from '../KineticText';

// ─── GlassCard ───────────────────────────────────────────────────────────────

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard>Card content</GlassCard>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    const { container } = render(<GlassCard>Default</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('glass-card');
  });

  it('applies emerald variant class', () => {
    const { container } = render(<GlassCard variant="emerald">Emerald</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('glass-card--emerald');
  });

  it('applies purple variant class', () => {
    const { container } = render(<GlassCard variant="purple">Purple</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('glass-card--purple');
  });

  it('applies cyan variant class', () => {
    const { container } = render(<GlassCard variant="cyan">Cyan</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('glass-card--cyan');
  });

  it('applies glow class when glowing is true', () => {
    const { container } = render(
      <GlassCard glowing variant="default">
        Glow
      </GlassCard>
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('glow-button');
  });

  it('does not apply glow class when glowing is false', () => {
    const { container } = render(<GlassCard glowing={false}>No glow</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('glow-button');
  });

  it('accepts additional className', () => {
    const { container } = render(<GlassCard className="extra-class">Styled</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('extra-class');
  });

  it('renders with hoverable set to false without hover div', () => {
    const { container } = render(<GlassCard hoverable={false}>No hover</GlassCard>);
    // When hoverable is false, no inner glow div is rendered
    const glowDiv = container.querySelector('.pointer-events-none');
    expect(glowDiv).toBeNull();
  });
});

// ─── BentoGrid ───────────────────────────────────────────────────────────────

describe('BentoGrid', () => {
  it('renders children inside grid', () => {
    render(
      <BentoGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </BentoGrid>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies bento-grid class', () => {
    const { container } = render(
      <BentoGrid>
        <div>Item</div>
      </BentoGrid>
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('bento-grid');
  });

  it('applies additional className', () => {
    const { container } = render(
      <BentoGrid className="custom-grid">
        <div>Item</div>
      </BentoGrid>
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('custom-grid');
  });
});

// ─── BentoItem ───────────────────────────────────────────────────────────────

describe('BentoItem', () => {
  it('renders children', () => {
    render(<BentoItem>Item content</BentoItem>);
    expect(screen.getByText('Item content')).toBeInTheDocument();
  });

  it('applies small size class by default', () => {
    const { container } = render(<BentoItem>Small</BentoItem>);
    const item = container.firstChild as HTMLElement;
    expect(item.className).toContain('bento-small');
  });

  it('applies large size class', () => {
    const { container } = render(<BentoItem size="large">Large</BentoItem>);
    const item = container.firstChild as HTMLElement;
    expect(item.className).toContain('bento-large');
  });

  it('applies wide size class', () => {
    const { container } = render(<BentoItem size="wide">Wide</BentoItem>);
    const item = container.firstChild as HTMLElement;
    expect(item.className).toContain('bento-wide');
  });

  it('applies tall size class', () => {
    const { container } = render(<BentoItem size="tall">Tall</BentoItem>);
    const item = container.firstChild as HTMLElement;
    expect(item.className).toContain('bento-tall');
  });

  it('applies additional className', () => {
    const { container } = render(<BentoItem className="my-item">Styled</BentoItem>);
    const item = container.firstChild as HTMLElement;
    expect(item.className).toContain('my-item');
  });
});

// ─── KineticText ─────────────────────────────────────────────────────────────

describe('KineticText', () => {
  it('renders words animation by default', () => {
    render(<KineticText text="Hello World" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('renders as h1 by default', () => {
    const { container } = render(<KineticText text="Heading" />);
    const heading = container.querySelector('h1');
    expect(heading).not.toBeNull();
  });

  it('renders as different element when "as" prop is set', () => {
    const { container } = render(<KineticText text="Para" as="p" />);
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
  });

  it('renders characters animation', () => {
    render(<KineticText text="AB" animation="characters" />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders lines animation', () => {
    const text = 'Line1\nLine2';
    render(<KineticText text={text} animation="lines" />);
    expect(screen.getByText('Line1')).toBeInTheDocument();
    expect(screen.getByText('Line2')).toBeInTheDocument();
  });

  it('renders gradient animation without splitting', () => {
    render(<KineticText text="Gradient text" animation="gradient" />);
    expect(screen.getByText('Gradient text')).toBeInTheDocument();
  });

  it('applies gradient class when gradient prop is true', () => {
    const { container } = render(<KineticText text="Shiny" gradient />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('gradient-text-animated');
  });

  it('applies additional className', () => {
    const { container } = render(<KineticText text="Styled" className="custom-text" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('custom-text');
  });
});
