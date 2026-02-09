import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => (props: any) => {
        const { children, ...rest } = props;
        const El = tag as any;
        return <El {...rest}>{children}</El>;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useTransform: () => 0,
  useSpring: () => ({ set: vi.fn(), get: () => 0 }),
  useInView: () => true,
  useScroll: () => ({ scrollYProgress: { get: () => 0, set: vi.fn() } }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('gsap', () => ({
  default: {
    to: vi.fn(),
    from: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

import { MagneticButton } from '../MagneticButton';

// ─── MagneticButton ──────────────────────────────────────────────────────────

describe('MagneticButton', () => {
  it('renders children text', () => {
    render(<MagneticButton>Click me</MagneticButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders as a button by default', () => {
    render(<MagneticButton>Button</MagneticButton>);
    const btn = screen.getByText('Button');
    expect(btn.tagName).toBe('BUTTON');
  });

  it('renders as a link when href is provided', () => {
    render(<MagneticButton href="/signup">Sign Up</MagneticButton>);
    const link = screen.getByText('Sign Up');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/signup');
  });

  it('applies primary variant classes by default', () => {
    render(<MagneticButton>Primary</MagneticButton>);
    const btn = screen.getByText('Primary');
    expect(btn.className).toContain('from-emerald-500');
  });

  it('applies secondary variant classes', () => {
    render(<MagneticButton variant="secondary">Secondary</MagneticButton>);
    const btn = screen.getByText('Secondary');
    expect(btn.className).toContain('from-purple-500');
  });

  it('applies ghost variant classes', () => {
    render(<MagneticButton variant="ghost">Ghost</MagneticButton>);
    const btn = screen.getByText('Ghost');
    expect(btn.className).toContain('bg-white/5');
  });

  it('applies hot variant classes', () => {
    render(<MagneticButton variant="hot">Hot</MagneticButton>);
    const btn = screen.getByText('Hot');
    expect(btn.className).toContain('from-orange-500');
  });

  it('applies glow class when glowing is true for primary', () => {
    render(
      <MagneticButton glowing variant="primary">
        Glow
      </MagneticButton>
    );
    const btn = screen.getByText('Glow');
    expect(btn.className).toContain('glow-button');
  });

  it('does not apply glow class when glowing is false', () => {
    render(
      <MagneticButton glowing={false} variant="primary">
        No Glow
      </MagneticButton>
    );
    const btn = screen.getByText('No Glow');
    expect(btn.className).not.toContain('glow-button');
  });

  it('applies additional className', () => {
    render(<MagneticButton className="extra-class">Styled</MagneticButton>);
    const btn = screen.getByText('Styled');
    expect(btn.className).toContain('extra-class');
  });

  it('handles click events on button', () => {
    const onClick = vi.fn();
    render(<MagneticButton onClick={onClick}>Clickable</MagneticButton>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state', () => {
    render(<MagneticButton disabled>Disabled</MagneticButton>);
    const btn = screen.getByText('Disabled') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('renders with base classes (inline-flex, rounded-xl, etc)', () => {
    render(<MagneticButton>Base</MagneticButton>);
    const btn = screen.getByText('Base');
    expect(btn.className).toContain('inline-flex');
    expect(btn.className).toContain('rounded-xl');
  });

  it('renders link variant with correct to prop', () => {
    render(<MagneticButton href="/forums">Forums</MagneticButton>);
    const link = screen.getByText('Forums');
    expect(link.getAttribute('href')).toBe('/forums');
  });
});
